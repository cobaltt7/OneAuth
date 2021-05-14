"use strict";

const express = require("express"),
	path = require("path");

// SET UP EXPRESS
const app = express();
app.enable("view cache");

// Mustache
app.engine(
	"html",
	require("mustache-express")(path.resolve(__dirname, "partials"), ".html"),
);
app.set("views", __dirname);
app.set("view engine", "html");

// Compress
app.use(require("compression")());

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
	if (
		req.get("User-Agent").indexOf("MSIE") >= 0 ||
		req.get("User-Agent").indexOf("Trident") >= 0 ||
		req.get("User-Agent").indexOf("Netscape") >= 0 ||
		req.get("User-Agent").indexOf("Navigator") >= 0
	) {
		return res
			.status(400)
			.render(path.resolve(__dirname, "errors/old.html"));
	}
	return next();
});

// Cookies
app.use((req, res, next) => {
	if (req.path.includes(".")) {
		return next();
	}
	return require("cookie-parser")()(req, res, next);
});

// Post request bodies
app.use((req, res, next) => {
	if (req.path.includes(".")) {
		return next();
	}
	return express.urlencoded({
		extended: false,
	})(req, res, next);
});

// Localization
app.use((req, res, next) => {
	if (req.path.includes(".")) {
		return next();
	}
	return require("./l10n.js").middleware(req, res, next);
});

// Docs
app.use("/docs", require("./docs/index.js"));

// Main pages
app.use(require("./main/index.js"));

// Auth pages
app.use("/auth", require("./auth/index.js"));

// Errors
app.use(require("./errors/index.js"));

// LISTEN
app.listen(3000, () => console.log("App ready"));
