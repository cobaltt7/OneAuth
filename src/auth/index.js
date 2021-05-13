"use strict";

const authClients = [],
	database = new (require("@replit/database"))(),
	globby = require("globby"),
	path = require("path"),
	retronid = require("retronid"),
	// eslint-disable-next-line new-cap
	router = require("express").Router(),
	{ URL } = require("url");

(async () => {
	// Idk why this is relative to the root dir but it is
	const paths = await globby("src/auth/*/index.js");

	paths.forEach((filepath) => {
		authClients.push(
			require(path.resolve(
				__dirname,
				__dirname.split("/src/")[0],
				filepath,
			)),
		);
	});
})();

const getClient = (requestedClient) =>
		authClients.find((currentClient) =>
			currentClient.pages.find(
				({ backendPage }) => backendPage === requestedClient,
			),
		),
	getPageHandler = (requestedClient) => {
		for (const currentClient of authClients) {
			const result = currentClient.pages.find(
				({ backendPage }) => backendPage === requestedClient,
			);
			if (result) {
				return result;
			}
		}
		return null;
	},
	sendResponse = async (client, tokenOrData, url, res) => {
		const { rawData } = getClient(client);
		let data, token;
		if (rawData) {
			data = tokenOrData;
			token = retronid.generate();
			await database.set(`RETRIEVE_${token}`, data);
		} else {
			data = "we can't show this data right now, sorry about that.";
			token = tokenOrData;
		}
		try {
			const { host } = new URL(url);
			return res
				.status(300)
				.render(path.resolve(__dirname, "allow.html"), {
					client,
					data: JSON.stringify(data),
					encodedUrl: encodeURIComponent(url),
					host,
					token,
					url,
				});
		} catch {
			return res.status(400);
		}
	};
for (const http of [
	// "all",
	"checkout",
	"copy",
	"delete",
	"get",
	"head",
	"lock",
	"merge",
	"mkactivity",
	"mkcol",
	"move",
	"m-search",
	"notify",
	"options",
	"patch",
	"post",
	"purge",
	"put",
	"report",
	"search",
	"subscribe",
	"trace",
	"unlock",
	"unsubscribe",
]) {
	router[http]("/auth/:client", (req, res) => {
		const client = getPageHandler(req.params.client);
		if (typeof client === "undefined" || client === null) {
			return res.status(404);
		}
		if (typeof client[http] !== "function") {
			return res.status(405);
		}
		return client[http](req, res, (...args) =>
			sendResponse(req.params.client, ...args),
		);
	});
}

router.get("/backend/get_data", async (req, res) => {
	// When data is being retrieved

	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept",
	);
	res.status(200).json(await database.get(`RETRIEVE_${req.query.code}`));
	await database.delete(`RETRIEVE_${req.query.code}`);
});
router.get("/backend/send_data", async (req, res) => {
	const { client, url, token } = req.query,
		{ getData, rawData } = getClient(client);
	let code, redirect;
	if (rawData) {
		code = token;
	} else {
		code = retronid.generate();
		await database.set(`RETRIEVE_${code}`, await getData(token));
	}
	try {
		redirect = new URL(url);
	} catch {
		return res.status(400);
	}
	redirect.searchParams.set("code", code);
	return res.status(303).redirect(redirect);
});

module.exports = router;