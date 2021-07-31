/** @file GitHub Authentication handler. */

import fetch from "node-fetch";

import { logError } from "../../errors/index.js";

/** @type {import("../../../types").Auth} Auth */
const client = {
	getData: (token) =>
		fetch("https://api.github.com/user", {
			headers: {
				Authorization: `token ${token}`,
				accept: "application/json",
			},
		}).then((result) => result.json()),

	icon: "github",
	iconProvider: "fab",

	link:
		"https://github.com/login/oauth/authorize" +
		"?client_id=7b64414fe57e07d1e969" +
		"&redirect_uri=https://auth.onedot.cf/auth/github" +
		"&state={{ url }}",

	name: "GitHub",

	pages: [
		{
			backendPage: "github",

			get: async (request, response, sendResponse) => {
				const info = await fetch("https://github.com/login/oauth/access_token", {
					body:
						"client_id=7b64414fe57e07d1e969" +
						`&client_secret=${process.env.githubSECRET}` +
						`&state=${request.query?.state}` +
						`&code=${request.query?.code}`,

					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"accept": "application/json",
					},

					method: "POST",
				})
					.then((fetchResult) => fetchResult.json())
					.catch((error) => {
						response.status(502);
						logError(error);
					});

				sendResponse(info.access_token, `${request.query?.state}`);
			},
		},
	],
};

export default client;
