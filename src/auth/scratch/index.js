"use strict";

/** @file Scratch Authentication handler. */

/** @type {import("../../../types").Auth} Auth */
module.exports = {
	icon: "https://scratch.mit.edu/favicon.ico",
	iconProvider: "url",

	link:
		"https://scratch.auth.onedot.cf" +
		"?url=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fscratch%3Furl={{ url }}",

	name: "Scratch",

	// This will change once onedotprojects/scratchCommentAuth#12 is done

	pages: [
		{
			backendPage: "scratch",

			get: (request, response, sendResponse) => {
				if (request.query?.verified) {
					return sendResponse(
						{ username: request.query?.username },
						`${request.query?.url}`,
					);
				}

				return response.status(403);
			},
		},
	],

	rawData: true,
};
