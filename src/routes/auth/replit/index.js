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
				return res.render(`${__dirname}/index.html`);
				if (username && userID) {
					return res.send("just for test");
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
