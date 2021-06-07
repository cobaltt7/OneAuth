/** @file Replit Authentication handler. */

const path = require("path");

/** @type {import("../../../types").Auth} Auth */ module.exports = {
	icon: "https://replit.com/public/images/logo.svg",
	iconProvider: "url",
	link: "/auth/replit?url={{url}}",
	name: "Replit",
	pages: [
		{
			backendPage: "replit",
			get: (req, res, sendResponse) => {
				const roles = req.get("X-Replit-User-Roles")?.split(",") || [],
					userID = req.get("X-Replit-User-Id"),
					username = req.get("X-Replit-User-Name");

				if (username && userID) {
					return sendResponse(
						{
							roles,
							userID,
							username,
						},
						`${req.query.url}`,
						res,
					);
				}
				return res.render(path.resolve(__dirname, "index.html"));
			},
		},
	],
	rawData: true,
};
