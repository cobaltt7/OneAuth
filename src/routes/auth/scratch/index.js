"use strict";

module.exports = {
	icon: "https://scratch.mit.edu/favicon.ico",
	iconProvider: "url",
	link:
		"https://scratchcommentauth.onedotprojects.repl.co?url=https://auth.onedot.cf/backend/scratch%3Furl={{url}}",
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
};
