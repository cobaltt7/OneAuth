"use strict";

/** @file Shows Error pages when errors occur. */

/** @type {{ [key: string]: number }} */
const changeTo = { 203: 204, 206: 204 };

const path = require("path");

/**
 * Logs an error to the console.
 *
 * @param {any} error - The error to log.
 *
 * @returns {void}
 * @todo Log it to an admin dashboard instead.
 */
function logError(error) {
	return console.error(error);
}

/**
 * Function to run once status is sent.
 *
 * @param {e.Request} request - Express request object.
 * @param {e.Response} response - Express response object.
 * @param {number} [_status] - Status override value.
 */
function middleware(request, response, _status) {
	const status = _status || response.statusCode;

	if (
		// If no content has already been sent
		!response.bodySent &&
		// And it's not a redirect
		(status < 301 ||
			status > 399 ||
			// (Allow the 300 codes that aren't actually redirects. Also, 300 is excluded above)
			status === 304 ||
			status === 305)
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

			middleware(request, response, changeTo[`${status}`]);
		} else {
			const error = {
				heading: request.messages[`error${status}Heading`],
				message: request.messages[`error${status}Message`],
				status,
			};

			if (
				request.accepts("application/json") ||
				request.accepts("text/json")
			)
				response.json(error);
			else response.render(path.resolve(__dirname, "error.html"), error);
		}
	}
}

module.exports.logError = logError;

/**
 * Express middleware to handle arror handling.
 *
 * @param {e.Request} request - Express request object.
 * @param {e.Response} response - Express response object.
 * @param {(error?: any) => void} next - Express continue function.
 *
 * @returns {void}
 */
module.exports.middleware = (request, response, next) => {
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	response.bodySent = false;

	if (request.path === "/old") {
		return response
			.status(400)
			.render(path.resolve(__dirname, "old.html"), {
				all: request.messages.errorOldAll,
			});
	}

	const realSend = response.send,
		realStatus = response.status;

	/**
	 * Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use `send` internally.
	 *
	 * @param {string} body - The content to send.
	 *
	 * @returns {void}
	 */
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	response.send = function send(body) {
		// eslint-disable-next-line no-param-reassign -- We need to override the original.
		response.bodySent = true;

		return realSend.call(this, body);
	};

	/**
	 * Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use `send` internally.
	 *
	 * @param {number} statusCode - The HTTP status code to send.
	 *
	 * @returns {e.Response} - Express response object.
	 */
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	response.status = function status(statusCode) {
		const returnValue = realStatus.call(
			this,
			statusCode === 200 && !response.bodySent ? 404 : statusCode,
		);

		middleware(request, response);

		return returnValue;
	};

	return next();
};
