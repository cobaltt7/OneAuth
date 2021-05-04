"use strict";

const fileSystem = require("fs"),
	getURL = require("../../../getUrl.js"),
	mustache = require("mustache");

module.exports = {
	icon: "envelope",
	iconProvider: "fas",
	link: "/auth/email?url={{url}}",
	name: "Email",
	pages: [
		{
			backendPage: "email",
			get: (_, res) => {
				res.render(`${__dirname}/index.html`);
			},
			post: async (req, res, sendResponse) => {
				const database = new (require("@replit/database"))();
				if (req.body.code && req.body.email) {
					const { email = null, date = null } =
						await database.get(`EMAIL_${req.body.code}`) || {};
					if (Date.now() - date > 900000) {
						await database.delete(`EMAIL_${req.body.code}`);
						return res.status(410).render(getURL("routes/errors/error.html"));
					}
					if (req.body.email !== email) {
						return res.status(401).render(getURL("routes/errors/error.html"));
					}
					await database.delete(`EMAIL_${req.body.code}`);
					return sendResponse(
						{
							email,
						},
						req,
						res,
					);
				}
				if (req.body.email && !req.body.code) {
					// Send email
					const Mail = require("nodemailer").createTransport({
							auth: {
								pass: process.env.GMAIL_PASS,
								user: process.env.GMAIL_EMAIL,
							},
							service: "gmail",
						}),
						code = require("retronid").generate();
					await database.set(`EMAIL_${code}`, {
						date: Date.now(),
						email: req.body.email,
					});
					res.status(201);

					Mail.sendMail(
						{
							from: process.env.GMAIL_EMAIL,
							html: mustache.render(fileSystem.readFileSync("./email.html", "utf8"), {
								code,
							}),
							subject: "1Auth Email Verification",
							text: mustache.render(fileSystem.readFileSync("./email.txt", "utf8"), {
								code,
							}),
							// eslint-disable-next-line id-length
							to: req.body.email,
						},
						(error, info) => {
							if (error) {
								console.error(error);
								return res.status(500).render(getURL("routes/errors/error.html"));
							}
							return res.json(info);
						},
					);
				}
				return res.status(400);
			},
		},
	],
};
