/** @file Replit Authentication handler. */

import atob from "atob";

import { logError } from "../../errors/index.js";

/** @type {import("../../../types").Auth} Auth */
const client = {
	icon: "https://replit.com/public/images/icon-square.png",
	link: "https://replit.com/auth_with_repl_site?domain=auth.onedot.cf&redirect={{ nonce }}",
	name: "Replit",

	pages: {
		"/__replauth": {
			async all(request) {
				const isValid = await fetch(
					`https://Replit-Auth.onedotprojects.repl.co/__replauth?token=${request.query.token}`,
				).then((response) => response.text());

				// Valid JWT
				if (isValid === "Auth Error: request hostname does not match claim host\n") {
					return this.sendResponse(
						JSON.parse(atob(`${request.query.token}`.split(".")[1])),
						`${request.query.redirect}`,
					);
				}

				// Incorrect syntax
				if (
					isValid === "Auth Error: unexpected end of JSON input\n" ||
					isValid.startsWith("Auth Error: invalid character")
				) {
					return this.sendResponse(
						{ error: "Incorrect syntax", message: isValid },
						`${request.query.redirect}`,
					);
				}

				// Invalid JWT
				if (isValid === "Auth Error: crypto/ecdsa: verification error\n") {
					return this.sendResponse(
						{ error: "Invalid token", message: isValid },
						`${request.query.redirect}`,
					);
				}

				// Unknown error
				logError(`${isValid}`);

				return this.sendResponse(
					{ error: "Unknown error", message: isValid },
					`${request.query.redirect}`,
				);
			},
		},
	},

	website: "https://replit.com/",
};

export default client;
