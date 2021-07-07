/** @file Replit Authentication handler. */

import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url)),

	/** @type {import("../../../types").Auth} Auth */
	client = {
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

					return response.render(path.resolve(directory, "index.html"));
				},
			},
		],

		rawData: true,
	};

export default client;
