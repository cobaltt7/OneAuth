/** @file Google Authentication handler. */

import atob from "atob";
import dotenv from "dotenv";
import fetch from "node-fetch";

import { logError } from "../../errors/index.js";

dotenv.config();

/** @type {import("../../../types").Auth} Auth */
const client = {
	icon: "https://developers.google.com/identity/images/g-logo.png",

	link:
		"https://accounts.google.com/o/oauth2/v2/auth" +
		"?response_type=code" +
		"&client_id=808400069481-nfa73dlrelv8rmtibnenjsdk4n0aj32r.apps.googleusercontent.com" +
		"&scope=openid%20email%20profile" +
		"&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle" +
		"&state={{ nonce }}",

	name: "Google",

	pages: {
		"./google": {
			async all(request) {
				const { id_token: idToken, error } = await fetch(
					"https://oauth2.googleapis.com/token",
					{
						body:
							`code=${request.query.code}` +
							`&client_id=${process.env.googleAppUrl}` +
							`&client_secret=${process.env.googleSecret}` +
							"&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle" +
							"&grant_type=authorization_code",

						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},

						method: "POST",
					},
				).then((result) => result.json());

				if (error || !idToken) {
					logError(new Error(error));

					return this.sendResponse({ error }, `${request.query.state}`);
				}

				/** @type {{ [key: string]: string }} */
				const filteredInfo = {},
					info = JSON.parse(atob(idToken.split(".")[1]));

				if (info.error) {
					logError(new Error(info.error));

					return this.sendResponse({ error: info.error }, `${request.query.state}`);
				}

				for (const item in info) {
					if (
						[
							"sub",
							"email",
							"email_verified",
							"family_name",
							"given_name",
							"locale",
							"name",
							"picture",
							"profile",
						].includes(item)
					)
						filteredInfo[`${item}`] = info[`${item}`];
				}

				return this.sendResponse(filteredInfo, `${request.query.state}`);
			},
		},
	},

	website: "https://google.com/",
};

export default client;
