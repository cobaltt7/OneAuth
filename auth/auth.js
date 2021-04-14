const router = require("express").Router();
const retronid = require("retronid").generate;
const db = new (require("@replit/database"))();

const auth_clients = require("./clients.js");
const get_client = (client) => {
	for (c of auth_clients) {
		const r = c.pages.find(({ backendPage }) => backendPage === client);
		if (r) return r;
	}
};
const sendResponse = async function (data, url, res) {
	const retro = retronid();
	await db.set("RETRIEVE_" + retro, data);
	try {
		const host = new URL(url).host;
		res.render("/home/runner/auth/views/allow.html", {
			url: url,
			host: host,
			data: `${data}`,
			code: retro,
			paramJoiner: url.indexOf("?") > -1 ? "&" : "?",
		});
	} catch (e) {
		return res.render("/home/runner/auth/routes/main/error.html");
	}
};
router.get("/auth/:client", (req, res) => {
	let client = get_client(req.params.client);
	if (typeof client === "undefined") {
		return res.status(404).sendFile("/home/runner/auth/routes/main/404.html");
	}
	client.get(req, res, sendResponse);
});
router.post("/auth/:client", (req, res) => {
	let client = get_client(req.params.client);
	if (typeof client === "undefined") {
		return res.status(404).sendFile("/home/runner/auth/routes/main/404.html");
	}
	client.post(req, res, sendResponse);
});

router.get("/backend/get_data/:code", async (req, res) => {
	// client is retriving data
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.json(await db.get("RETRIEVE_" + req.params.code));
	await db.delete("RETRIEVE_" + req.params.code);
});
router.get("/backend/remove_data/:code", async (req, res) => {
	// user denies sharing data
	if (!req.params.code) {
		return res.status(400).send("Missing code");
	}
	res.json(await db.set("RETRIEVE_" + req.params.code), { error: "Denied access" });
});

module.exports = router;
