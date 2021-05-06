"use strict";

module.exports = {
	icon: "https://repl.it/public/images/logo.svg",
	iconProvider: "url",
	link: "/auth/replit?url={{url}}",
	name: "Replit",
	pages: [
		{
			backendPage: "replit",
			get: (req, res, sendResponse) => {
				const roles = req.get("X-Replit-User-Roles").split(",") || [],
					userID = req.get("X-Replit-User-Id"),
					username = req.get("X-Replit-User-Name");
				return res.render(`${__dirname}/index.html`); // move this after the if when done testing
				if (username && userID) {
					return sendResponse(
						{
							roles,
							userID,
							username,
						},
						req.query.url,
						res,
					);
				}
			},
		},
	],
	rawData: true,
};
