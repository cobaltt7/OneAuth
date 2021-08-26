/** @file Email Authentication handler. */

import fileSystem from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import mustache from "mustache";
import nodemailer from "nodemailer";
import retronid from "retronid";

import { mustacheFunction } from "../../../lib/localization.js";
import { EmailItem } from "../../../lib/mongoose.js";

dotenv.config();

const directory = path.dirname(fileURLToPath(import.meta.url)),
	mail = nodemailer.createTransport({
		auth: { pass: process.env.GMAIL_PASS, user: process.env.GMAIL_EMAIL },
		service: "gmail",
	});

dotenv.config();

/** @type {import("../../../types").Auth} Auth */
const client = {
	fontAwesome: "fas",
	icon: "envelope",
	link: "/auth/email?nonce={{ nonce }}",
	name: "Email",

	pages: {
		"./email": {
			async all(request, response) {
				if (request.method !== "POST")
					return response.render(path.resolve(directory, "index.html"));

				if (request.body?.code && request.body?.email) {
					const { email, date } = await EmailItem.findOne({
						code: request.body.code,
					}).exec();

					if (Date.now() - date > 900000) {
						await EmailItem.deleteOne({ code: request.body.code }).exec();

						return response.status(410);
					}

					if (request.body.email !== email) return response.status(401);

					await EmailItem.deleteOne({ code: request.body.code }).exec();

					return this.sendResponse({ email }, `${request.query?.nonce}`);
				}

				if (request.body?.email) {
					// Send email

					const code = retronid();

					await new EmailItem({
						code,
						date: Date.now(),
						email: request.body.email,
					}).save();

					await mail.sendMail({
						from: process.env.GMAIL_EMAIL,

						html: mustache.render(
							fileSystem.readFileSync(path.resolve(directory, "email.html"), "utf8"),
							{
								code,

								message: mustacheFunction(
									request.localization.languages,
									request.localization.messages,
								),
							},
						),

						subject: request.localization.messages["clients.email.email.subject"],

						text: mustache.render(
							fileSystem.readFileSync(path.resolve(directory, "email.txt"), "utf8"),
							{
								code,

								message: mustacheFunction(
									request.localization.languages,
									request.localization.messages,
								),
							},
						),

						// eslint-disable-next-line id-length -- We didn't name this.
						to: request.body.email,
					});

					return response.status(204);
				}

				return response.status(400);
			},
		},
	},
};

export default client;
