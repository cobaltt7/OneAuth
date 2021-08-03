/** @file Discord Authentication handler. */

import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

/** @type {import("../../../types").Auth} Auth */
const client = {
	getData: async (token) => {
		const tokens = await fetch("https://discord.com/api/oauth2/token", {
				body:
					`client_id=871197807883739187&client_secret=${
						process.env.DISCORD_SECRET || ""
					}` +
					`&code=${token}&grant_type=authorization_code&scope=identify+connections+email` +
					"&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fdiscord",

				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},

				method: "POST",
			}).then((result) => result.json()),
			user = await fetch("https://discord.com/api/users/@me", {
				headers: {
					authorization: `${tokens.token_type} ${tokens.access_token}`,
				},
			}).then((result) => result.json());

		user.connections = await fetch("https://discord.com/api/users/@me/connections", {
			headers: {
				authorization: `${tokens.token_type} ${tokens.access_token}`,
			},
		}).then((result) => result.json());

		return user;
	},

	icon: "https://discord.com/assets/3437c10597c1526c3dbd98c737c2bcae.svg",

	iconProvider: "url",

	link: "http://discord.com/api/oauth2/authorize?client_id=871197807883739187&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fdiscord&response_type=code&scope=identify%20connections%20email&state={{ url }}",

	name: "Discord",

	pages: [
		{
			backendPage: "discord",

			get: (request, _, sendResponse) =>
				sendResponse(`${request.query.code}`, `${request.query.state}`),
		},
	],
};

export default client;
