/** @file Replit Authentication handler. */

import path from "path";
import { fileURLToPath } from "url";

/** @type {import("../../../types").Auth} Auth */
const client = {
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

				return response.render(
					path.resolve(path.dirname(fileURLToPath(import.meta.url)), "index.html"),
				);
			},
		},
	],

	rawData: true,
};

export default client;
