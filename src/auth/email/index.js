/** @file Email Authentication handler. */

import crypto from "crypto";
import fileSystem from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import mongoose from "mongoose";
import mustache from "mustache";

import mailjet from "node-mailjet";
import retronid from "retronid";

import { mustacheFunction } from "../../../lib/localization.js";
import { logError } from "../../errors/index.js";

dotenv.config();

const directory = path.dirname(fileURLToPath(import.meta.url)),
	email = {
		html: fileSystem.readFileSync(path.resolve(directory, "email.html"), "utf8"),
		text: fileSystem.readFileSync(path.resolve(directory, "email.txt"), "utf8"),
	},
	mail = mailjet
		.connect(process.env.MAILJET_ID || "", process.env.MAILJET_PASSWORD || "")
		.post("send", { version: "v3.1" }),
	/** @type {{ [key: string]: number }} */
	requestLog = {},
	uncapped = 6000 / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

await mongoose.connect(process.env.MONGO_URL || "", {
	appName: "OneAuth",
});
mongoose.connection.on("error", logError);

const Database = mongoose.model(
	"Email",
	new mongoose.Schema({
		code: {
			match: /^[\da-z]{10}$/,
			required: true,
			type: String,
			unique: true,
		},

		date: {
			default: Date.now(),
			type: Date,
		},

		email: {
			match: /^(?=[\w!#$%&'*+./=?@^{|}~\-]{6,254}$)(?=[\w!#$%&'*+./=?^{|}~\-]{1,64}@)[\w!#$%&'*+/=?^{|}~\-]+(?:\.[\w!#$%&'*+/=?^{|}~\-]+)*@(?:(?=[\da-z\-]{1,63}\.)[\da-z](?:[\da-z\-]*[\da-z])?\.)+(?=[\da-z\-]{1,63}$)[\da-z](?:[\da-z\-]*[\da-z])?$/gim,
			required: true,
			type: String,
		},

		nonce: {
			match: /^[\da-z]{10}$/,
			required: true,
			type: String,
			unique: true,
		},
	}),
);

let emailsLeftToday = uncapped > 200 ? 200 : uncapped,
	nextSendAt = Date.now();

/** @type {import("../../../types").Auth} Auth */
const client = {
	fontAwesome: "fas",
	icon: "envelope",
	link: "./email?nonce={{ nonce }}",
	name: "Email",

	pages: {
		"./email": {
			async all(request, response) {
				if (request.body.email && request.body.captcha) {
					if (Date.now() < nextSendAt) {
						logError("Email blocked to avoid hitting Mailjet limits");

						return response.sendError(429, `${nextSendAt}`);
					}

					const ipHash = crypto.createHash("sha256").update(request.ip).digest("hex");

					if (requestLog[`${ipHash}`] > Date.now()) {
						logError("Email blocked to avoid spam");

						return response.sendError(429, `${requestLog[`${ipHash}`]}`);
					}

					requestLog[`${ipHash}`] = Date.now() + 300000;

					// Verify reCAPTCHA
					const recaptcha = await fetch(
						`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${request.body.captcha}`,
						{ method: "POST" },
					).then((result) => result.json());

					if (
						!recaptcha.success ||
						recaptcha["error-codes"]?.length ||
						recaptcha.hostname !== request.hostname
					) {
						logError(recaptcha);

						return response.status(403);
					}

					// Send email
					const code = retronid();

					try {
						await new Database({
							code,
							date: Date.now(),
							email: request.body.email,
							nonce: request.query.nonce,
						}).save();
					} catch {
						return response.status(400);
					}

					await mail.request({
						Messages: [
							{
								From: {
									Email: `${process.env.GMAIL_EMAIL}`,
									Name: request.localization.messages["clients.email.email.from"],
								},

								HTMLPart: mustache.render(email.html, {
									code,

									message: mustacheFunction(
										request.localization.languages,
										request.localization.messages,
									),
								}),

								Subject:
									request.localization.messages["clients.email.email.subject"],

								TextPart: mustache.render(email.text, {
									code,

									message: mustacheFunction(
										request.localization.languages,
										request.localization.messages,
									),
								}),

								// eslint-disable-next-line id-length -- We didn't name this.
								To: [{ Email: `${request.body.email}` }],
							},
						],
					});

					const date = new Date();

					date.setSeconds(
						1 /
							((--emailsLeftToday / -3600) * date.getHours() -
								60 * date.getMinutes() -
								date.getSeconds() +
								86400),
					);

					// eslint-disable-next-line require-atomic-updates -- It's not assigned based on itself?
					nextSendAt = Math.min(date.getTime(), new Date(Date.now() + 1000).getTime());

					return response.status(204);
				}

				if (request.body.code && request.body.email && request.query.nonce) {
					const data = await Database.findOne({
						code: request.body.code,
						email: request.body.email,
						nonce: request.query.nonce,
					}).exec();

					if (!data) return response.status(403);

					if (Date.now() - data.date > 900000) {
						await Database.deleteOne({ code: request.body.code }).exec();

						return response.status(410);
					}

					await Database.deleteOne({ code: request.body.code }).exec();

					return this.sendResponse(data, data.nonce);
				}

				if (request.method === "POST") return response.status(401);

				return response.render(path.resolve(directory, "index.html"));
			},
		},
	},
};

export default client;
