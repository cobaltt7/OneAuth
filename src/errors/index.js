/** @file Shows Error pages when errors occur. */

/** @type {{ [key: number]: number }} */
const changeTo = { 203: 204, 206: 204 };

const path = require("path");

/**
 * Logs an error to the console.
 *
 * @param {any} err - The error to log.
 * @returns {void}
 * @todo Log it to an admin dashboard instead.
 */
function logError(err) {
	return console.error(err);
}

/**
 * Function to run once status is sent.
 *
 * @param {e.Request} req - Express request object.
 * @param {e.Response} res - Express response object.
 * @param {number} [_status] - Status override value.
 * @returns {void | e.Response | null} - Nothing of interest.
 */
function middleware(req, res, _status) {
	const status = _status || res.statusCode;
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
			logError(
				new RangeError(
					`Do not use the HTTP status code ${status}. Instead, use ${changeTo[status]}.`,
				),
			);
			return middleware(req, res, changeTo[status]);
		}

		const error = {
			heading: req.messages[`error${status}Heading`],
			message: req.messages[`error${status}Message`],
			status,
		};
		if (Object.values(error).filter((key) => !key))
			return middleware(req, res, 500);

		if (req.accepts("application/json") || req.accepts("text/json"))
			return res.json(error);
		return res.render(path.resolve(__dirname, "error.html"), { ...error });
	}
	return null;
}

module.exports = {
	logError,
	/**
	 * Express middleware to handle arror handling.
	 *
	 * @param {e.Request} req - Express request object.
	 * @param {e.Response} res - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 * @returns {void}
	 */
	middleware: (req, res, next) => {
		res.bodySent = false;
		if (req.path === "/old") {
			return res.status(400).render(path.resolve(__dirname, "old.html"), {
				all: req.messages.errorOldAll,
			});
		}
		const { send, status } = res;
		res.send = function (...args) {
			// Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use`send` internally.

			res.bodySent = true;
			return send.call(this, ...args);
		};
		res.status = function (statusCode, ...args) {
			// Also applys to `res.sendStatus` which uses `status` internally.
			const returnVal = status.call(
				this,
				statusCode === 200 && !res.bodySent ? 404 : statusCode,
				...args,
			);
			middleware(req, res);
			return returnVal;
		};
		return next();
	},
};
