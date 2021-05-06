"use strict";

module.exports = {
	icon: "https://scratch.mit.edu/favicon.ico",
	iconProvider: "url",
	link:
		"https://scratch.auth.onedot.cf?url=https://auth.onedot.cf/auth/scratch%3Furl={{url}}",
	name: "Scratch",
	/*
	 * This uses the old backend page (/backend/scratch)
	 * (to be moved)
	 *
	 * note from wgyt:
	 *
	 * all we need to get (for now) are the querystrings
	 * username and verified. once we get them check if verified
	 * is true, if it is pass data to sendResponse if not go back
	 * to the link
	 * this will change once onedotprojects/scratchCommentAuth#12
	 * is done
	 */
	pages: [
		{
			backendPage: "scratch",
			get: (req, res, sendResponse) => {
				if (req.query.verified=='true') {
					return sendResponse({ username: req.query.username }, req.query.url, res);
				}
			},
		},
	],
	rawData: true,
};
