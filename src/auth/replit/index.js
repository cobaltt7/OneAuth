/** @file Replit Authentication handler. */

import atob from "atob";

/** @type {import("../../../types").Auth} Auth */
const client = {
	icon: "https://replit.com/public/images/logo.svg",
	link: "https://replit.com/auth_with_repl_site?domain=auth.onedot.cf&redirect={{ nonce }}",
	name: "Replit",

	pages: [
		{
			backendPage: "../__replauth",

			get: (request, _, sendResponse) =>
				sendResponse(
					JSON.parse(atob(`${request.query.token}`.split(".")[1])),
					`${request.query.redirect}`,
				),
		},
	],

	rawData: true,
	website: "https://replit.com/",
};

export default client;
