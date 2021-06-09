/** @file Main Script that sets up Express and Express middleware. */

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

// Errors
const errors = require("./errors/index.js");
app.use(errors.middleware);

// Compress
const compression = require("compression");
app.use(compression());

app.use(
	/**
	 * Set caching headers.
	 *
	 * @param {e.Request} req - Express request object.
	 * @param {e.Response} res - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 */
	(req, res, next) => {
		if (req.path.includes(".css"))
			res.setHeader("Cache-Control", "public, max-age=86400");
		else if (req.path.includes("."))
			res.setHeader("Cache-Control", "public, max-age=31536000");

		next();
	},
);

app.use(
	/**
	 * Disalow old browsers from visiting our site.
	 *
	 * @param {e.Request} req - Express request object.
	 * @param {e.Response} res - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 * @returns {void}
	 * @todo Make our site available to old browsers.
	 */
	(req, res, next) => {
		if (req.path.includes(".") || req.path === "/old") return next();

		const userAgent = `${req.get("User-Agent")}`;
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
	},
);

// Info sent (cookies, bodies)
const bodyParser = express.urlencoded({
		extended: true,
	}),
	cookieParser = require("cookie-parser")();
app.use(
	/**
	 * Parse cookies for use in request handlers.
	 *
	 * @param {e.Request} req - Express request object.
	 * @param {e.Response} res - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 * @returns {void}
	 */
	(req, res, next) => {
		if (req.path.includes(".")) return next();
		return cookieParser(req, res, next);
	},
);
app.use(
	/**
	 * Parse POST request bodies for use in request handlers.
	 *
	 * @param {e.Request} req - Express request object.
	 * @param {e.Response} res - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 * @returns {void}
	 */
	(req, res, next) => {
		if (req.path.includes(".")) return next();

		return bodyParser(req, res, next);
	},
);

// Localization
const l10n = require("./l10n.js").middleware;
app.use(l10n);

// Docs
const docs = require("./docs/index.js").router;
app.use("/docs", docs);

// Main pages
const main = require("./main/index.js");
app.use(main);

// Auth pages
const auth = require("./auth/index.js");
app.use("/auth", auth);

// LISTEN
// eslint-disable-next-line no-console
app.listen(3000, () => console.log("App ready"));
