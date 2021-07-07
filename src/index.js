/** @file Main Script that sets up Express and Express middleware. */

// SET UP EXPRESS
import express, { urlencoded } from "express";
import { dirname, resolve } from "node:path";
import mustacheExpress from "mustache-express";
import { errorPages, old } from "./errors/index.js";
import compression from "compression";
import cookieParser from "cookie-parser";
import localization from "./l10n.js";
import documentation from "./docs/index.js";
import main from "./main/index.js";
import auth from "./auth/index.js";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url)),
	app = express(),
	// Mustache
	mustacheExpressEngine = mustacheExpress(resolve(directory, "partials"), ".html");

app.engine("html", mustacheExpressEngine);
app.engine("css", mustacheExpressEngine);

app.use(compression());

app.use(errorPages);

app.use(
	/**
	 * Set caching headers.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => undefined} next - Express continue function.
	 */
	(request, response, next) => {
		if (request.path.includes(".css"))
			response.setHeader("Cache-Control", "public, max-age=86400");
		else if (request.path.includes("."))
			response.setHeader("Cache-Control", "public, max-age=31536000");

		next();
	},
);

app.use(old);

// Information parsing
const bodyParser = urlencoded({
	extended: true,
});

app.use(
	/**
	 * Parse cookies for use in request handlers.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => undefined} next - Express continue function.
	 *
	 * @returns {undefined}
	 */
	(request, response, next) => {
		if (request.path.includes(".")) return next();

		return cookieParser()(request, response, next);
	},
);
app.use(
	/**
	 * Parse POST request bodies for use in request handlers.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => undefined} next - Express continue function.
	 *
	 * @returns {undefined}
	 */
	(request, response, next) => {
		if (request.path.includes(".")) return next();

		return bodyParser(request, response, next);
	},
);

// Pages
app.use(localization);
app.use("/docs", documentation);
app.use(main);
app.use("/auth", auth);

app.use(
	/**
	 * Send a 404 response.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {e.Response} - Express response object.
	 */
	(_, response) => response.status(404),
);

// LISTEN
// eslint-disable-next-line no-console -- We need to know when it's ready.
app.listen(3000, () => console.log("App ready"));
