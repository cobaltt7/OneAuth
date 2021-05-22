/** @file GitHub Authentication handler. */

const nodeFetch = require("node-fetch");
const fetch = nodeFetch.default ?? nodeFetch,
	logError=require("../../errors/index.js").logError

/** @type {import("../../../types").Auth} Auth */
module.exports = {
	getData: (token) =>
		fetch("https://api.github.com/user", {
			headers: {
				Authorization: `token ${token}`,
				accept: "application/json",
			},
		}).then(
			(
				/** @type {any} */
				res,
			) => res.json(),
		),
	icon: "github",
	iconProvider: "fab",
	link:
		"https://github.com/login/oauth/authorize" +
		"?client_id=7b64414fe57e07d1e969" +
		"&redirect_uri=https://auth.onedot.cf/auth/github" +
		"&state={{url}}",
	name: "GitHub",

	pages: [
		{
			backendPage: "github",
			get: async (req, res, sendResponse) => {
				const info = await fetch(
					"https://github.com/login/oauth/access_token",
					{
						body:
							"client_id=7b64414fe57e07d1e969" +
							`&client_secret=${process.env.githubSECRET}` +
							`&code=${req.query.code}` +
							`&state=${req.query.state}`,
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
							"accept": "application/json",
						},
						method: "POST",
					},
				)
					.then(
						(
							/** @type {any} */
							result,
						) => result.json(),
					)
					.catch(
						(
							/** @type {Error} */
							err,
						) => {
							res.status(502);
							logError(err);
						},
					);

				sendResponse(info.access_token, `${req.query.state}`, res);
			},
		},
	],
};
