"use strict";

const router = require("express").Router();
const retronid = require("retronid").generate;
const db = new (require("@replit/database"))();
const URL = require("url").URL;

const authClients = require("./clients.js");
const getPageHandler = (client) => {
	for (const c of authClients) {
		const r = c.pages.find(({ backendPage }) => backendPage === client);
		if (r) {
			return r;
		}
	}
};
const getDataRetriever = (client) => {
	return authClients.find((c) => c.pages.find(({ backendPage }) => backendPage === client)).getData;
};
const sendResponse = async (client, token, url, res) => {
	const data = getDataRetriever(client)(token);
	try {
		const host = new URL(url).host;
		res.status(300).render("/home/runner/auth/views/allow.html", {
			"encoded-url": encodeURIComponent(url),
			url: url,
			host: host,
			data: `${data}`,
			token: token,
			client: client,
			paramJoiner: url.indexOf("?") > -1 ? "&" : "?",
		});
	} catch (e) {
		return res.status(400).render("/home/runner/auth/routes/main/error.html");
	}
};
router.get("/auth/:client", (req, res) => {
	let client = getPageHandler(req.params.client);
	if (typeof client === "undefined") {
		return res.status(404).render("/home/runner/auth/routes/main/404.html");
	}
	if (typeof client.get !== "function") {
		return res.status(405).render("/home/runner/auth/routes/main/405.html");
	}
	client.get(req, res, (...args) => sendResponse(getDataRetriever(req.params.client), ...args));
});
router.post("/auth/:client", (req, res) => {
	let client = getPageHandler(req.params.client);
	if (typeof client === "undefined") {
		return res.status(404).render("/home/runner/auth/routes/main/404.html");
	}
	if (typeof client.post !== "function") {
		return res.status(405).render("/home/runner/auth/routes/main/405.html");
	}
	client.post(req, res, (token, url, res) => sendResponse(req.params.client, token, url, res));
});

router.get("/backend/get_data/:code", async (req, res) => {
	// client is retriving data
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.status(200).json(await db.get("RETRIEVE_" + req.params.code));
	await db.delete("RETRIEVE_" + req.params.code);
});
router.get("/backend/remove_data/:code", async (req, res) => {
	// user denies sharing data
	if (!req.params.code) {
		return res.status(400).send("Missing code");
	}
	res.status(200).json(await db.set("RETRIEVE_" + req.params.code), { error: "Denied access" });
});

module.exports = router;
