/** @file Shows Error pages when errors occur. */

/** @type {{ [key: number]: number }} */
const changeTo = { 203: 204, 206: 204 };

const path = require("path");

/**
 * Function to run once status is sent.
 *
 * @param {import("../../types").ExpressRequest} req - Express request object.
 * @param {import("../../types").ExpressResponse} res - Express response object.
 * @returns {import("express").IRouter | null} - Nothing of interest.
 */
function middleware(req, res) {
	res.statusCode =
		res.statusCode === 200 && !res.bodySent ? 404 : res.statusCode;
	const status = res.statusCode;
	if (
		// If no content has already been sent
		!res.bodySent &&
		// And it's not a redirect
		(status < 301 ||
			status > 399 ||
			// (Allow the 300 codes that aren't actually redirects)
			status === 304 ||
			status === 305)
	) {
		// Then it's an error code, send error page.
		if (changeTo[status]) {
			// @ts-expect-error
			res.statusCode = changeTo[status];
			return middleware(req, res);
		}
		const error = {
			heading: req.messages[`error${status}Heading`],
			message: req.messages[`error${status}Message`],
			status,
		};
		if (Object.values(error).filter((key) => !key)) {
			res.statusCode = 500;
			return middleware(req, res);
		}

		if (req.accepts("application/json") || req.accepts("text/json"))
			return res.json(error);
		return res.render(path.resolve(__dirname, "error.html"), { ...error });
	}
	return null;
}

/**
 * Logs an error to the console.
 *
 * @param {any} err - The error to log.
 * @returns {void}
 */
function logError(err) {
	// TODO: Log it to an admin dashboard instead.
	return console.error(err);
}

module.exports = {
	logError,
	/**
	 * Express middleware to handle arror handling.
	 *
	 * @param {import("../../types").ExpressRequest} req - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @param {import("express").NextFunction} next - Express next function.
	 * @returns {import("express").IRouter | void} - Nothing of interest.
	 */
	middleware: (req, res, next) => {
		res.bodySent = false;
		if (req.path === "/old") {
			return res.status(400).render(path.resolve(__dirname, "old.html"), {
				all: req.messages.errorOldAll,
			});
		}
		const realSend = res.send,
			realStatus = res.status;
		res.send = function (...args) {
			// Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use `send` internally.

			res.bodySent = true;
			return realSend.call(this, ...args);
		};
		res.status = function (status, ...args) {
			// Also applys to `res.sendStatus` which uses `status` internally.

			const returnVal = realStatus.call(
				this,
				status === 200 ? 204 : status,
				...args,
			);
			middleware(req, res);
			return returnVal;
		};
		return next();
	},
};
