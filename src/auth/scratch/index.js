/** @file Scratch Authentication handler. */

/** @type {import("../../../types").Auth} Auth */
const client = {
	icon: "https://scratch.mit.edu/favicon.ico",

	link:
		"https://scratch.auth.onedot.cf" +
		"?url=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fscratch%3Fnonce={{ nonce }}",

	name: "Scratch",

	pages: [
		{
			backendPage: "./scratch",

			get: (request, response, sendResponse) => {
				if (request.query?.verified) {
					return sendResponse(
						{ username: request.query?.username },
						`${request.query?.nonce}`,
					);
				}

				return response.status(403);
			},
		},
	],

	rawData: true,
	website: "https://scratch.mit.edu/",
};

export default client;
