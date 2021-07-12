/** @file Shows Error pages when errors occur. */

import path from "path";
import { fileURLToPath } from "url";

/** @type {{ [key: string]: number }} */
const changeTo = { 206: 204 },
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
 * @param {(status: number) => import("express").Response} realStatus - Original Express `status` function.
 * @param {import("express").Request} request - Express request object.
 * @param {import("express").Response} response - Express response object.
 * @param {number} status - HTTP status code.
 */
function middleware(realStatus, request, response, status = response.statusCode) {
	if (
		// If no content has already been sent
		!response.headersSent &&
		// And it's not a redirect
		(status < 301 ||
			status > 399 ||
			// Allow 300 (above) and 304 (below) since they aren't actually redirects.
			status === 304)
	) {
		// Then it's an error code, send error page.
		if (changeTo[`${status}`]) {
			logError(
				new RangeError(
					`Do not use the HTTP status code ${status}. Instead, use ${
						changeTo[`${status}`]
					}.`,
				),
			);

			middleware(realStatus, request, response, changeTo[`${status}`]);

			return;
		}

		const error = {
			errorMessage: request.messages[`error${status}Message`],
			heading: request.messages[`error${status}Heading`],
			status,
		};

		// @ts-expect-error -- We *want* to check `.includes(undefined)`.
		if (Object.keys(error).includes()) {
			middleware(realStatus, request, response, 500);

			return;
		}

		setTimeout(() => {
			if (response.headersSent) return;

			if (request.accepts("text/html"))
				response.render(path.resolve(directory, "error.html"), error);
			else response.json(error);
		}, 3000);

		realStatus.call(response, status);
	}

	setTimeout(() => {
		if (!response.headersSent) {
			middleware(
				realStatus,
				request,
				response,
				Math.floor(status / 100) === 2 ? 408 : status,
			);
		}
	}, 3000);
}

/**
 * Express middleware to handle arror handling.
 *
 * @param {import("express").Request} request - Express request object.
 * @param {import("express").Response} response - Express response object.
 * @param {import("express").NextFunction} next - Express continue function.
 *
 * @returns {void}
 */
export function errorPages(request, response, next) {
	if (request.path === "/old") {
		return response.status(400).render(path.resolve(directory, "old.html"), {
			all: request.messages.errorOldAll,
		});
	}

	const realStatus = response.status;

	/**
	 * Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use `send` internally.
	 *
	 * @param {number} statusCode - The HTTP status code to send.
	 *
	 * @returns {import("express").Response} - Express response object.
	 */
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	response.status = function status(statusCode) {
		middleware(realStatus, request, response, statusCode);

		return response;
	};

	return next();
}

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
export function old(request, response, next) {
	if (request.path.includes(".") || request.path === "/old") return next();

	const userAgent = `${request.get("User-Agent")}`;

	if (
		userAgent.includes("MSIE") ||
		userAgent.includes("Trident") ||
		userAgent.includes("Netscape") ||
		userAgent.includes("Navigator")
	)
		return response.status(400).render(path.resolve(directory, "old.html"));

	return next();
}
