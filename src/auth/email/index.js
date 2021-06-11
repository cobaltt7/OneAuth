/** @file Email Authentication handler. */

require("dotenv").config();

const database = new (require("@replit/database"))(),
	{ logError } = require("../../errors/index.js"),
	fileSystem = require("fs"),
	mail = require("nodemailer").createTransport({
		auth: { pass: process.env.GMAIL_PASS, user: process.env.GMAIL_EMAIL },
		service: "gmail",
	}),
	mustache = require("mustache"),
	{ mustacheFunc } = require("../../l10n.js"),
	path = require("path"),
	retronid = require("retronid").generate;

/** @type {import("../../../types").Auth} Auth */
module.exports = {
	icon: "envelope",
	iconProvider: "fas",
	link: "/auth/email?url={{ url }}",
	name: "Email",
	pages: [
		{
			backendPage: "email",
			get: (_, res) => {
				res.render(path.resolve(__dirname, "index.html"));
			},
			post: async (req, res, sendResponse) => {
				if (req.body?.code && req.body?.email) {
					const { email = "", date = Date.now() - 900001 } =
						(await database.get(`EMAIL_${req.body.code}`)) ?? {};
					if (Date.now() - date > 900000) {
						database.delete(`EMAIL_${req.body.code}`);
						return res.status(410);
					}
					if (req.body.email !== email) return res.status(401);

					database.delete(`EMAIL_${req.body.code}`);
					return sendResponse(
						{
							email,
						},
						`${req.query?.url}`,
						res,
					);
				}
				if (req.body?.email) {
					// Send email

					const code = retronid();
					database.set(`EMAIL_${code}`, {
						date: Date.now(),
						email: req.body.email,
					});

					return mail.sendMail(
						{
							from: process.env.GMAIL_EMAIL,
							html: mustache.render(
								fileSystem.readFileSync(
									path.resolve(__dirname, "email.html"),
									"utf8",
								),
								{
									code,
									message: mustacheFunc(
										req.languages,
										req.messages,
									),
								},
							),
							subject: req.messages.emailSubject,
							text: mustache.render(
								fileSystem.readFileSync(
									path.resolve(__dirname, "email.txt"),
									"utf8",
								),
								{
									code,
									message: mustacheFunc(
										req.languages,
										req.messages,
									),
								},
							),
							// eslint-disable-next-line id-length
							to: req.body.email,
						},
						/**
						 * Verify sent email.
						 *
						 * @param {Error} error - Error object if an error occured.
						 * @param {{ [key: string]: any }} info - Information about the sent email
						 *   if no error occured.
						 *
						 * @returns {e.Response} - Express response object.
						 */
						(error, info) => {
							logError(info);
							if (error) {
								logError(error);
								return res.status(500);
							}
							return res.status(204);
						},
					);
				}
				return res.status(400);
			},
		},
	],
	rawData: true,
};
