/** @file Shows Error pages when errors occur. */

/** @type {{ [key: number]: number }} */
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
 * @param {e.Response} result - Express response object.
 * @param {number} [_status] - Status override value.
 *
 * @returns {void | e.Response | null} - Nothing of interest.
 */
function middleware(request, result, _status) {
	const status = _status || result.statusCode;
	if (
		// If no content has already been sent
		!result.bodySent &&
		// And it's not a redirect
		(status < 301 ||
			status > 399 ||
			// Allow the 300 codes that aren't actually redirects. Also, 300 is excluded above.
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
			return middleware(request, result, changeTo[status]);
		}

		const error = {
			heading: request.messages[`error${status}Heading`],
			message: request.messages[`error${status}Message`],
			status,
		};
		if (Object.values(error).filter((key) => !key))
			return middleware(request, result, 500); // this is the error

		if (request.accepts("application/json") || request.accepts("text/json"))
			return result.json(error);
		return result.render(path.resolve(__dirname, "error.html"), {
			...error,
		});
	}
	return null;
}

module.exports.logError = logError;
/**
 * Express middleware to handle arror handling.
 *
 * @param {e.Request} request - Express request object.
 * @param {e.Response} result - Express response object.
 * @param {(error?: any) => void} next - Express continue function.
 *
 * @returns {void}
 */
module.exports.middleware = (request, result, next) => {
	result.bodySent = false;
	if (request.path === "/old") {
		return result.status(400).render(path.resolve(__dirname, "old.html"), {
			all: request.messages.errorOldAll,
		});
	}
	const { bodySent } = result,
		realSend = result.send,
		realStatus = result.status;
	result.send = function (...arguments_) {
		// Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use`send` internally.
		result.bodySent = true;
		return realSend.call(this, ...arguments_);
	};
	result.status = function (statusCode, ...arguments_) {
		// Also applys to `result.sendStatus` which uses `status` internally.
		const returnValue = realStatus.call(
			this,
			statusCode === 200 && !bodySent ? 404 : statusCode,
			...arguments_,
		);
		middleware(request, result);
		return returnValue;
	};
	return next();
};
