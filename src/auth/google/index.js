"use strict";

const atob = require("atob"),
	fetch = require("node-fetch");
require("dotenv").config();

module.exports = {
	getData: async (token) => {
		const filteredInfo = {},
			{ id_token: idToken = ".eyJlcnJvciI6InRvbyBzbG93In0=." } =
				await fetch("https://oauth2.googleapis.com/token", {
					body:
						`code=${token}` +
						`&client_id=${process.env.googleAppUrl}` +
						`&client_secret=${process.env.googleSecret}` +
						"&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle" +
						"&grant_type=authorization_code",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
				}).then((res) => res.json()),
			info = JSON.parse(atob(idToken.split(".")[1]));
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
					"error",
				].includes(item)
			) {
				filteredInfo[`${item}`] = info[item];
			}
		}

		return filteredInfo;
	},
	icon: "google",
	iconProvider: "svg",
	link:
		"https://accounts.google.com/o/oauth2/v2/auth" +
		"?response_type=code" +
		"&client_id=808400069481-nfa73dlrelv8rmtibnenjsdk4n0aj32r.apps.googleusercontent.com" +
		"&scope=openid%20email%20profile" +
		"&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle" +
		"&state={{url}}" +
		"&nonce={{nonce}}",
	name: "Google",
	pages: [
		{
			backendPage: "google",
			get: (req, res, sendResponse) => {
				sendResponse(req.query.code, req.query.state, res);
			},
		},
	],
};
