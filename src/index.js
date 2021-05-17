"use strict";

// SET UP EXPRESS
const express = require("express"),
	path = require("path");

const app = express(),
	// Mustache
	mustacheExpress = require("mustache-express")(
		path.resolve(__dirname, "partials"),
		".html",
	);
app.engine("html", mustacheExpress);
app.engine("css", mustacheExpress);

// Compress
const compression = require("compression");
app.use(compression());

// Cache
app.use((req, res, next) => {
	if (req.path.includes(".css")) {
		res.setHeader("Cache-Control", "public, max-age=86400");
	} else if (req.path.includes(".")) {
		res.setHeader("Cache-Control", "public, max-age=31536000");
	}
	next();
});

// Old browsers
app.use((req, res, next) => {
	if (req.path.includes(".")) {
		return next();
	}
	const userAgent = req.get("User-Agent");
	if (
		userAgent.indexOf("MSIE") >= 0 ||
		userAgent.indexOf("Trident") >= 0 ||
		userAgent.indexOf("Netscape") >= 0 ||
		userAgent.indexOf("Navigator") >= 0
	) {
		return res
			.status(400)
			.render(path.resolve(__dirname, "errors/old.html"));
	}
	return next();
});

// Info sent (cookies, bodies)
const bodyParser = express.urlencoded({
		extended: true,
	}),
	cookieParser = require("cookie-parser")();
app.use((req, res, next) => {
	if (req.path.includes(".")) {
		return next();
	}
	return cookieParser(req, res, next);
});
app.use((req, res, next) => {
	if (req.path.includes(".")) {
		return next();
	}
	return bodyParser(req, res, next);
});

// Localization
const l10n = require("./l10n.js").middleware;
app.use(l10n);

// Docs
const docs = require("./docs/index.js");
app.use("/docs", docs);

// Main pages
const main = require("./main/index.js");
app.use(main);

// Auth pages
const auth = require("./auth/index.js");
app.use("/auth", auth);

// Errors
const errors = require("./errors/index.js");
app.use(errors);

// LISTEN
app.listen(3000, () => console.log("App ready"));
