"use strict";

const fetch = require("node-fetch");

module.exports = {
	icon: "github",
	iconProvider: "fa",
	link:
		"https://github.com/login/oauth/authorize?client_id=Iv1.1db69635c026c31d&redirect_uri=https://auth.onedot.cf/auth/github&state={{url}}",
	name: "GitHub",

	// To be migrated
	pages: [
		{
			backendPage: "github",
			get: async (req, res, sendResponse) => {
				const info = await fetch("https://github.com/login/oauth/access_token", {
					body:
						"client_id=Iv1.1database69635c026c31d" +
						`&client_secret=${process.env.githubSECRET}` +
						`&code=${req.query.code}` +
						`&state=${req.query.state}`,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						accept: "application/json",
					},
					method: "POST",
				})
					.then((result) => result.json())
					.catch((err) => res.status(502).json(err));
				fetch("https://api.github.com/user", {
					headers: {
						// jshint camelcase:false
						Authorization: `token ${info.data.access_token}`,
						// jshint camelcase:true
					},
				})
					.then((response) => {
						sendResponse(response.data, req.query.state, res);
					})
					.catch((err) => res.status(502).json(err));
			},
		},
	],
};
// GitHub
