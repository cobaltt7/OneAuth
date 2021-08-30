/** @file Shows Error pages when errors occur. */

import path from "path";
import { fileURLToPath } from "url";

import { Router as express } from "express";

const app = express(),
	/** @type {{ [key: number]: number }} */
	changeTo = { 206: 204 },
	directory = path.dirname(fileURLToPath(import.meta.url));

/**
 * Logs an error to the console.
 *
 * @param {any} error - The error to log.
 *
 * @returns {void}
 * @todo Log it to an admin dashboard instead.
 */
export function logError(error) {
	return console.error(error);
}

/**
 * Function to run once status is sent.
 *
 * @param {import("express").Request} request - Express request object.
 * @param {import("express").Response} response - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} [message] - Optioal error message.
 *
 * @returns {import("express").Response} - Express response object.
 * @todo Show the `message` to the user.
 */
function statusMiddleware(request, response, statusCode = response.statusCode, message = "") {
	if (
		// If no content has already been sent
		!response.headersSent &&
		// And it's not a redirect
		(statusCode < 301 ||
			statusCode > 399 ||
			// Allow 300 (above) and 304 (below) since they aren't actually redirects.
			statusCode === 304)
	) {
		// Then it's an error code, send error page.
		if (changeTo[+statusCode]) {
			logError(
				new RangeError(
					`Do not use the HTTP status code ${statusCode}. Instead, use ${
						changeTo[+statusCode]
					}.`,
				),
			);

			return statusMiddleware(request, response, changeTo[+statusCode]);
		}

		const error = {
			errorMessage: request.localization.messages[`errors.${statusCode}.message`],
			heading: request.localization.messages[`errors.${statusCode}.heading`],
			moreInfo: message,
			status: statusCode,
		};

		// @ts-expect-error -- We *want* to check `.includes(undefined)`.
		if (Object.keys(error).includes()) return statusMiddleware(request, response, 500);

		const returnValue = response._status(statusCode);

		logError(`${statusCode} at ${request.url}${message ? ` with message ${message}` : ""}`);

		if (request.accepts("html")) response.render(path.resolve(directory, "error.html"), error);
		else response.json(error);

		return returnValue;
	}

	return response;
}

app.use((request, response, next) => {
	next();
	// Timeout all requests after 5 secconds.
	setTimeout(() => {
		if (!response.headersSent) statusMiddleware(request, response, 408);
	}, 5000);
});

app.all("/old", (_, response) => response.render(path.resolve(directory, "old.html")));

app.use((request, response, next) => {
	response._status = response.status;

	/**
	 * Set HTTP response status code.
	 *
	 * @param {number} statusCode - HTTP status code.
	 *
	 * @returns {import("express").Response} - Express response object.
	 */
	response.status = (statusCode) => statusMiddleware(request, response, statusCode);

	/**
	 * Set HTTP response status code and send an error message.
	 *
	 * @param {number} statusCode - HTTP status code.
	 * @param {string} message - Error message.
	 *
	 * @returns {import("express").Response} - Express response object.
	 */
	response.sendError = (statusCode, message) =>
		statusMiddleware(request, response, statusCode, message);

	return next();
});
app.use(
	/**
	 * Disalow old browsers from visiting our site.
	 *
	 * @param {import("express").Request} request - Express request object.
	 * @param {import("express").Response} response - Express response object.
	 * @param {import("express").NextFunction} next - Express continue function.
	 *
	 * @returns {void}
	 * @todo Make our site available to old browsers.
	 */
	(request, response, next) => {
		if (request.path.includes(".") || request.path === "/old") return next();

		const userAgent = `${request.get("User-Agent")}`;

		if (
			userAgent.includes("MSIE") ||
			userAgent.includes("Trident") ||
			userAgent.includes("Netscape") ||
			userAgent.includes("Navigator")
		)
			return response._status(400).render(path.resolve(directory, "old.html"));

		return next();
	},
);

app.all("/418", (_, response) => response.status(418));

export default app;
