"use strict";

/** @file Email Authentication handler. */

require("dotenv").config();

const ReplitDB = require("@replit/database"),
	database = new ReplitDB(),
	{ logError } = require("../../errors"),
	fileSystem = require("fs"),
	mail = require("nodemailer").createTransport({
		auth: { pass: process.env.GMAIL_PASS, user: process.env.GMAIL_EMAIL },
		service: "gmail",
	}),
	mustache = require("mustache"),
	{ mustacheFunction } = require("../../l10n"),
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

			get: (_, response) => {
				response.render(path.resolve(__dirname, "index.html"));
			},

			post: async (request, response, sendResponse) => {
				if (request.body?.code && request.body?.email) {
					const { email = "", date = Date.now() - 900001 } =
						(await database.get(`EMAIL_${request.body.code}`)) ?? {};

					if (Date.now() - date > 900000) {
						database.delete(`EMAIL_${request.body.code}`);

						return response.status(410);
					}

					if (request.body.email !== email) return response.status(401);

					database.delete(`EMAIL_${request.body.code}`);

					return sendResponse(
						{
							email,
						},
						`${request.query?.url}`,
					);
				}

				if (request.body?.email) {
					// Send email

					const code = retronid();

					database.set(`EMAIL_${code}`, {
						date: Date.now(),
						email: request.body.email,
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

									message: mustacheFunction(request.languages, request.messages),
								},
							),

							subject: request.messages.emailSubject,

							text: mustache.render(
								fileSystem.readFileSync(
									path.resolve(__dirname, "email.txt"),
									"utf8",
								),
								{
									code,

									message: mustacheFunction(request.languages, request.messages),
								},
							),

							// eslint-disable-next-line id-length -- We didn't name this.
							to: request.body.email,
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

								return response.status(500);
							}

							return response.status(204);
						},
					);
				}

				return response.status(400);
			},
		},
	],

	rawData: true,
};
