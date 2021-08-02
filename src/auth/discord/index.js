/** @file Discord Authentication handler. */
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
/** @type {import("../../../types").Auth} Auth */
const client = {
	name: "Discord",
	link: "http://discord.com/api/oauth2/authorize?client_id=871197807883739187&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fdiscord&response_type=code&scope=identify%20connections%20email&state={{url}}",
	icon: "https://discord.com/assets/3437c10597c1526c3dbd98c737c2bcae.svg",
	iconProvider: "url",
	pages: [
		{
			backendPage: "discord",
			get: async (request, response, sendResponse) => {
				return sendResponse(request.query.code, request.query.state)
			},
		},
	],
	getData: async (token) => {
		const tokens = await fetch("https://discord.com/api/oauth2/token", {
					method: "POST",
					body: new URLSearchParams({
						client_id: "871197807883739187",
						client_secret: process.env.DISCORD_SECRET,
						code: token,
						grant_type: "authorization_code",
						scope: "identify connections email",
						redirect_uri: "https://auth.onedot.cf/auth/discord",
					}),
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}).then((result) => result.json());
				const user = await fetch("https://discord.com/api/users/@me", {
					headers: {
						authorization: `${tokens.token_type} ${tokens.access_token}`,
					},
				}).then((result) => result.json());
				user.connections = await fetch("https://discord.com/api/users/@me/connections", {
					headers: {
						authorization: `${tokens.token_type} ${tokens.access_token}`,
					},
				}).then((result) => result.json());
				return user
	}
};
export default client;
