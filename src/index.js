"use strict";

/** @file Main Script that sets up Express and Express middleware. */

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
const errors = require("./errors").middleware;
app.use(errors);

// Compress
const compression = require("compression");

app.use(compression());

app.use(
	/**
	 * Set caching headers.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 */
	(request, response, next) => {
		if (request.path.includes(".css"))
			response.setHeader("Cache-Control", "public, max-age=86400");
		else if (request.path.includes("."))
			response.setHeader("Cache-Control", "public, max-age=31536000");

		next();
	},
);

app.use(
	/**
	 * Disalow old browsers from visiting our site.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 *
	 * @returns {void}
	 * @todo Make our site available to old browsers.
	 */
	(request, response, next) => {
		if (request.path.includes(".") || request.path === "/old")
			return next();

		const userAgent = `${request.get("User-Agent")}`;

		if (
			userAgent.includes("MSIE") ||
			userAgent.includes("Trident") ||
			userAgent.includes("Netscape") ||
			userAgent.includes("Navigator")
		) {
			return response
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
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 *
	 * @returns {void}
	 */
	(request, response, next) => {
		if (request.path.includes(".")) return next();

		return cookieParser(request, response, next);
	},
);
app.use(
	/**
	 * Parse POST request bodies for use in request handlers.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 *
	 * @returns {void}
	 */
	(request, response, next) => {
		if (request.path.includes(".")) return next();

		return bodyParser(request, response, next);
	},
);

// Localization
const localization = require("./l10n").middleware;

app.use(localization);

// Docs
const documentation = require("./docs").router;

app.use("/docs", documentation);

// Main pages
const main = require("./main");

app.use(main);

// Auth pages
const auth = require("./auth");

app.use("/auth", auth);

// LISTEN
// eslint-disable-next-line no-console -- We need to know when it's ready.
app.listen(3000, () => console.log("App ready"));

