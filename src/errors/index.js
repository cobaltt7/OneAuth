/** @file Shows Error pages when errors occur. */

const ERRORS = [
	{
		error: "Created",
		message: "An item in our databases has successfully been created.",
		status: 201,
	},
	{
		error: "Accepted",
		message:
			"Your request has been accepted and understood. We forwarded it to another server.",
		status: 202,
	},
	{
		error: "Non-Authoritative Information",
		changeTo: 204,
		status: 203,
	},
	{
		error: "No Content",
		message:
			"Your request was successful. However, we don't have any response for you.",
		status: 204,
	},
	{
		error: "Reset Content",
		message:
			"Your request was successful. Reset any pages that use our APIs as the content may have changed.",
		status: 205,
	},

	{ changeTo: 204, error: "Partial Content", status: 206 },
	{
		error: "Multiple Choice",
		message: "Please pick a redirection method or location to continue.",
		status: 300,
	},
	{
		error: "Not Modified",
		message:
			"The requested page has not been modified since the last request.",
		status: 304,
	},
	{
		error: "Use Proxy ",
		message: "A proxy is needed to access this page.",
		status: 305,
	},
	{
		error: "Bad Request",
		message:
			"Oops! Your request was invalid. Please make sure all needed information is sent, no extra information is sent, and all sent information is valid. If this keeps happening, try contacting us on GitHub.",
		status: 400,
	},
	{
		error: "Unauthorized",
		message: "Please log in before accessing this resource.",
		status: 401,
	},
	{
		error: "Payment Required ",
		message: "Please pay before accessing this page.",
		status: 402,
	},
	{
		error: "Forbidden",
		message: "Sorry, but you are forbidden to access this resource.",
		status: 403,
	},
	{
		error: "Not Found",
		message:
			"Uh-oh! We're can't find that page! Go back? If a link on this site lead you here, you may want to contact us on GitHub and let us know we have a broken link.",
		status: 404,
	},
	{
		error: "Method Not Allowed",
		message:
			"That HTTP method isn't supported on this page! Try a different page and/or method.",
		status: 405,
	},
	{
		error: "Not Acceptable",
		message: "We can't match the data requested with the format requested.",
		status: 406,
	},
	{
		error: "Proxy Authentication Required",
		message:
			"Please log in through a proxy before accessing this resource.",
		status: 407,
	},
	{
		error: "Request Timeout",
		message:
			"Hmm...the page was loading for quite a while and timed out! Perhaps there was an internal error. Try reloading the page. If this keeps happening, you may want to contact us on GitHub so we can fix it.",
		status: 408,
	},
	{
		error: "Conflict",
		message:
			"Oops, there was a conflict between the information your browser sent and the information we have! Try reloading the page. If this keeps happening, try contacting us on GitHub so we can fix it.",
		status: 409,
	},
	{
		error: "Gone",
		message:
			"This isn't here any anymore. Unfortunately, it's never coming back.",
		status: 410,
	},
	{
		error: "Length Required",
		message:
			"You didn't say how much information you wanted! Please repeat the request with a requested length.",
		status: 411,
	},
	{
		error: "Precondition Failed",
		message: "Unfortunately, we can't meet your conditions. Too bad!",
		status: 412,
	},
	{
		error: "Payload Too Large",
		message: "You sent so much data, we can't process it!",
		status: 413,
	},
	{
		error: "URI Too Long",
		message: "That URL is too long for us to understand!",
		status: 414,
	},
	{
		error: "Unsupported Media Type",
		message: "You sent the wrong type of file!",
		status: 415,
	},
	{
		error: "Range Not Satisfiable",
		message: "We don't have any data in the requested range.",
		status: 416,
	},
	{
		error: "Expectation Failed",
		message: "You didn't send information we expected to receive!",
		status: 417,
	},
	{
		error: "I'm a teapot",
		message: "We refuse to try and brew coffee with a teapot.",
		status: 418,
	},
	{
		error: "Misdirected Request",
		message: "You sent this request to the wrong place!",
		status: 421,
	},
	{
		error: "Too Early ",
		message:
			"Please wait in sending this request so it won't be sent twice.",
		status: 425,
	},
	{
		error: "Upgrade Required",
		message: "Please use HTTPS, not HTTP.",
		status: 426,
	},
	{
		error: "Precondition Required",
		message:
			"You can't do that yet. Please fulfill the requested conditions first.",
		status: 428,
	},
	{
		error: "Too Many Requests",
		message:
			"You have sent too many requests in a short amount of time. Please wait before sending more.",
		status: 429,
	},
	{
		error: "Request Header Fields Too Large",
		message: "The headers of your request are too long to be processed.",
		status: 431,
	},
	{
		error: "Unavailable For Legal Reasons",
		message:
			"Unfortunately, we cannot legally provide this page to you. Sorry about that!",
		status: 451,
	},
	{
		error: "Internal Server Error",
		message:
			"Uh-oh, you found a bug! We ran into an unexpected error. Please report it on GitHub so we can stop this from happening again.",
		status: 500,
	},
	{
		error: "Not Implemented",
		message:
			"No part of our website supports that HTTP method. Try a different one!",
		status: 501,
	},
	{
		error: "Bad Gateway",
		message: "We got an invalid response from an external service.",
		status: 502,
	},
	{
		error: "Service Unavailable",
		message:
			"Sorry! This page is currently down! It should be back up soon!",
		status: 503,
	},
	{
		error: "Gateway Timeout",
		message: "An external server didn't send us a response fast enough.",
		status: 504,
	},
	{
		error: "HTTP Version Not Supported",
		message:
			"That HTTP version isn't supported by any part of this website.",
		status: 505,
	},
	{
		error: "Variant Also Negotiates",
		message:
			"Error in our internal configuration! Please report this on GitHub so we can prevent it from happening again.",
		status: 506,
	},
	{
		error: "Not Extended",
		message:
			"We can't show you this page with the information given. Please extend your request.",
		status: 510,
	},
];

const path = require("path");

function middleware(req, res, next) {
	if(req.path==="/old"){
	return res.status(400).render(path.resolve(__dirname, "old.html"), {
		all: req.messages.errorOldAll,
	});
}
	res.statusCode = res.statusCode === 200 && !res.bodySent ? 404 : res.statusCode;
	const code=res.statusCode
	console.log(code);
	if (
		// If no content has already been sent
		!res.bodySent &&
		// And it's not a redirect
		(code < 301 || code > 399
		// (Allow the 300 codes that aren't actually redirects)
		|| code === 304 || code === 305)
	) {
		// Then it's an error code, send error page.
		const error=ERRORS.find(error=>error.status===code)
		if(error.changeTo){
			res.statusCode=error.changeTo
			return middleware(_,res,next)
		}
		if(req.accepts('application/json')){return res.json(error)}else{
		return res.render(path.resolve(__dirname, "error.html"),{error})}
	}
	return next();
}

function logError(err){return console.error(err)}

module.exports = {
	middleware:(req, res, next) => {
		res.bodySent = false;
		const realSend = res.send,
			realStatus = res.status;
		res.send = function (...args) {
			// This overrides not just not just `res.send`, but `res.sendFile`, `res.sendStatus`, `res.render`, and ectera as well, since Express uses `res.send` internally for all of those.

			res.bodySent = true;
			return realSend.call(this, ...args);
		};
		res.status = function (status, ...args) {
			const returnVal = realStatus.call(this, status===200?204:status, ...args);
			middleware(req, res, next);
			return returnVal;
		};
		return next();
	},
	logError
};
