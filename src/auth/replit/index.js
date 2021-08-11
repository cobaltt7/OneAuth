/** @file Replit Authentication handler. */

import atob from "atob";
import fetch from "node-fetch";

import { logError } from "../../errors/index.js";

/** @type {import("../../../types").Auth} Auth */
const client = {
	async getData(token) {
		const isValid = await fetch(
			`https://Replit-Auth.onedotprojects.repl.co/__replauth?token=${token}`,
		).then((response) => response.text());

		// Valid JWT
		if (isValid === "Auth Error: request hostname does not match claim host\n")
			return JSON.parse(atob(token.split(".")[1]));

		// Invalid syntax
		if (
			isValid === "Auth Error: unexpected end of JSON input\n" ||
			isValid.startsWith("Auth Error: invalid character")
		)
			return { error: "Incorrect syntax" };

		// Invalid JWT
		if (isValid === "Auth Error: crypto/ecdsa: verification error\n")
			return { error: "Invalid token" };

		// Unknown error
		logError(`${isValid}`);

		return { error: "Unknown error", message: isValid };
	},

	icon: "https://replit.com/public/images/logo.svg",
	link: "https://replit.com/auth_with_repl_site?domain=auth.onedot.cf&redirect={{ nonce }}",
	name: "Replit",

	pages: [
		{
			backendPage: "../__replauth",

			get: (request, _, sendResponse) =>
				sendResponse(`${request.query.token}`, `${request.query.redirect}`),
		},
	],

	website: "https://replit.com/",
};

export default client;
