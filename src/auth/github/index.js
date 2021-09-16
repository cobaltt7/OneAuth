/** @file GitHub Authentication handler. */

import dotenv from "dotenv";

import { logError } from "../../errors/index.js";

dotenv.config();

/** @type {import("../../../types").Auth} Auth */
const client = {
	fontAwesome: "fab",

	icon: "github",

	link:
		"https://github.com/login/oauth/authorize" +
		`?client_id=${process.env.GITHUB_ID}` +
		"&redirect_uri=https://auth.onedot.cf/auth/github" +
		"&state={{ nonce }}",

	name: "GitHub",

	pages: {
		"./github": {
			async all(request, response) {
				const info = await fetch("https://github.com/login/oauth/access_token", {
					body:
						`client_id=${process.env.GITHUB_ID}` +
						`&client_secret=${process.env.GITHUB_SECRET}` +
						`&state=${request.query.state}` +
						`&code=${request.query.code}`,

					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"accept": "application/json",
					},

					method: "POST",
				})
					.then((fetchResult) => fetchResult.json())
					.catch((error) => {
						response.status(502);

						return logError(error);
					});

				return this.sendResponse(
					await fetch("https://api.github.com/user", {
						headers: {
							Authorization: `token ${info.access_token}`,
							accept: "application/json",
						},
					}).then((result) => result.json()),
					`${request.query.state}`,
				);
			},
		},
	},

	website: "https://github.com/",
};

export default client;
