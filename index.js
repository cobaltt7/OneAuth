"use strict";

// SET UP EXPRESS
const express = require("express");
const app = express();
app.set("view engine", "html");
app.disable("view cache");
console.log("Express ready");
// Mustache
const mustache = require("mustache-express");
app.engine("html", mustache(`${__dirname}/routes/main/partials`, ".html"));
// Cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser());
// Compress
const compression = require("compression");
app.use(compression());
// Post request bodies
app.use(
	express.urlencoded({
		extended: true,
	}),
);
app.use(
	express.urlencoded({
		extended: false,
	}),
);

// Old browsers
app.use((req, res, next) => {
	if (req.url.indexOf(".css") >= 0 || req.url.indexOf(".js") >= 0) {
		return next();
	}
	if (
		req.get("User-Agent").indexOf("MSIE") >= 0 ||
		req.get("User-Agent").indexOf("Trident") >= 0 ||
		req.get("User-Agent").indexOf("Netscape") >= 0 ||
		req.get("User-Agent").indexOf("Navigator") >= 0
	) {
		return res.status(400).render(`${__dirname}/routes/main/old.html`);
	}
	return next();
});

// Main pages
app.use("/", require("./routes/main/main.js"));
console.log("Main pages ready");
// Auth pages
app.use("/", require("./auth/auth.js"));
// OTHER SETUP
require("dotenv").config();
const { URL } = require("url"),
	database = new (require("@replit/database"))(),
	retronid = require("retronid").generate;
// AUTH STUFF
async function sendResponse(data, url, res) {
	const retro = retronid();
	await database.set(`RETRIEVE_${retro}`, data);
	try {
		const { host } = new URL(url);
		return res.status(300).render("/home/runner/auth/views/allow.html", {
			code: retro,
			data: `${data}`,
			host,
			paramJoiner: url.indexOf("?") > -1 ? "&" : "?",
			url,
		});
	} catch (_) {
		return res.status(400).render("/home/runner/auth/routes/main/error.html");
	}
}
// GitHub
const fetch = require("node-fetch");
app.get("/backend/github", async (req, res) => {
	const info = await fetch("https://github.com/login/oauth/access_token", {
		body:
			"client_id=Iv1.1database69635c026c31d" +
			`&client_secret=${process.env.githubSECRET}` +
			`&code=${req.query.code}` +
			`&state=${req.query.state}`,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			accept: "application/json",
		},
		method: "POST",
	})
		.then((result) => result.json())
		.catch((err) => res.status(502).json(err));
	fetch("https://api.github.com/user", {
		headers: {
			// jshint camelcase:false
			Authorization: `token ${info.data.access_token}`,
			// jshint camelcase:true
		},
	})
		.then((response) => {
			sendResponse(response.data, req.query.state, res);
		})
		.catch((err) => res.status(502).json(err));
});
// Scratch
app.get("/backend/scratch/", (req, res) => {
	if (req.query.verified) {
		sendResponse({ username: req.query.username }, req.query.url, res);
	}
});
app.get("/backend/scratchredirect", (req, res) => {
	res.redirect(
		`https://scratch.auth.onedot.cf?url=${encodeURIComponent(
			`https://auth.onedot.cf/backend/scratch?url=${encodeURIComponent(req.query.url)}`,
		)}`,
	);
});
console.log("Auth pages ready");

// 404 PAGE
app.use((_, res) => {
	res.status(404).render(`${__dirname}/routes/main/404.html`);
});
console.log("404 page ready");

// LISTEN
app.listen(3000, () => console.log("App ready"));
