"use strict";

/** @file Replit Authentication handler. */

const path = require("path");

/** @type {import("../../../types").Auth} Auth */
module.exports = {
	icon: "https://replit.com/public/images/logo.svg",
	iconProvider: "url",
	link: "/auth/replit?url={{ url }}",
	name: "Replit",

	pages: [
		{
			backendPage: "replit",

			get: (request, response, sendResponse) => {
				const roles = request.get("X-Replit-User-Roles")?.split(",") || [],
					userID = request.get("X-Replit-User-Id"),
					username = request.get("X-Replit-User-Name");

				if (username) {
					return sendResponse(
						{
							roles,
							userID,
							username,
						},
						`${request.query?.url}`,
					);
				}

				return response.render(path.resolve(__dirname, "index.html"));
			},
		},
	],

	rawData: true,
};
