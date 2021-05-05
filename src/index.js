"use strict";

// SET UP EXPRESS
const express = require("express");
const app = express();
app.set("view engine", "html");
app.disable("view cache");
console.log("Express ready");
// Mustache
app.engine("html", require("mustache-express")(`${__dirname}/routes/partials`, ".html"));
// Cookies
app.use(require("cookie-parser")());
// Compress
app.use(require("compression")());
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
		return res.status(400).render(`${__dirname}/routes/errors/old.html`);
	}
	return next();
});

// Main pages
app.use(require("./routes/main/index.js"));
console.log("Main pages ready");
// Auth pages
app.use(require("./routes/auth/index.js"));
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
		return res.status(300).render(`${__dirname}/views/allow.html`, {
			code: retro,
			data: `${data}`,
			host,
			paramJoiner: url.indexOf("?") > -1 ? "&" : "?",
			url,
		});
	} catch (_) {
		return res.status(400).render(`${__dirname}/routes/errors/error.html`);
	}
}

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

// Errors
app.use(require("./routes/errors/index.js"));
console.log("Error pages ready");

// LISTEN
app.listen(3000, () => console.log("App ready"));
