/** @file Email Authentication handler. */

import dotenv from "dotenv";
import ReplitDB from "@replit/database";
import { logError } from "../../errors/index.js";
import fileSystem from "node:fs";
import nodemailer from "nodemailer";
import mustache from "mustache";
import { mustacheFunction } from "../../l10n.js";
import path from "node:path";
import retronid from "retronid";
const database = new ReplitDB();
const mail = nodemailer.createTransport({
	auth: { pass: process.env.GMAIL_PASS, user: process.env.GMAIL_EMAIL },
	service: "gmail",
});
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

/** @type {import("../../../types").Auth} Auth */
const client = {
	icon: "envelope",
	iconProvider: "fas",
	link: "/auth/email?url={{ url }}",
	name: "Email",

	pages: [
		{
			backendPage: "email",

			get: (_, response) => {
				response.render(path.resolve(directory, "index.html"));
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

					const code = retronid.generate();

					database.set(`EMAIL_${code}`, {
						date: Date.now(),
						email: request.body.email,
					});

					return mail.sendMail(
						{
							from: process.env.GMAIL_EMAIL,

							html: mustache.render(
								fileSystem.readFileSync(
									path.resolve(directory, "email.html"),
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
									path.resolve(directory, "email.txt"),
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

export default client;
