"use strict";

require("dotenv").config();

const database = new (require("@replit/database"))(),
	fileSystem = require("fs"),
	mail = require("nodemailer").createTransport({
		auth: {
			pass: process.env.GMAIL_PASS,
			user: process.env.GMAIL_EMAIL,
		},
		service: "gmail",
	}),
	mustache = require("mustache"),
	path = require("path"),
	retronid = require("retronid").generate;

module.exports = {
	icon: "envelope",
	iconProvider: "fas",
	link: "/auth/email?url={{url}}",
	name: "Email",
	pages: [
		{
			backendPage: "email",
			get: (_, res) => {
				res.render(path.resolve(__dirname, "index.html"));
			},
			post: async (req, res, sendResponse) => {
				if (req.body.code && req.body.email) {
					const { email = null, date = null } =
						(await database.get(`EMAIL_${req.body.code}`)) ?? {};
					if (Date.now() - date > 900000) {
						await database.delete(`EMAIL_${req.body.code}`);
						return res.status(410);
					}
					if (req.body.email !== email) {
						return res.status(401);
					}
					await database.delete(`EMAIL_${req.body.code}`);
					return sendResponse(
						{
							email,
						},
						req.query.url,
						res,
					);
				}
				if (req.body.email && !req.body.code) {
					// Send email

					const code = retronid();
					await database.set(`EMAIL_${code}`, {
						date: Date.now(),
						email: req.body.email,
					});

					mail.sendMail(
						{
							from: process.env.GMAIL_EMAIL,
							html: mustache.render(
								fileSystem.readFileSync(
									path.resolve(__dirname, "email.html"),
									"utf8",
								),
								{
									code,
								},
							),
							subject: "1Auth Email Verification",
							text: mustache.render(
								fileSystem.readFileSync(
									path.resolve(__dirname, "email.txt"),
									"utf8",
								),
								{
									code,
								},
							),
							// eslint-disable-next-line id-length
							to: req.body.email,
						},
						(error, info) => {
							if (error) {
								console.error(error);
								return res.status(500);
							}
							return res.status(200).json(info);
						},
					);
				}
				return res.status(400);
			},
		},
	],
	rawData: true,
};