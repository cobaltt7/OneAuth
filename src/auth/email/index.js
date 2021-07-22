/** @file Email Authentication handler. */

import fileSystem from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import mustache from "mustache";
import nodemailer from "nodemailer";
import retronid from "retronid";

import { logError } from "../../errors/index.js";
import { mustacheFunction } from "../../l10n.js";

dotenv.config();

const database = new MongoClient(process.env.MONGO_URL || "", {
		appName: "auth",
		// "logger":logError,
		// "useNewUrlParser": true,
		// "useUnifiedTopology": true,
	})
		.db("auth")
		.collection("auth"),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	mail = nodemailer.createTransport({
		auth: { pass: process.env.GMAIL_PASS, user: process.env.GMAIL_EMAIL },
		service: "gmail",
	}),

	/** @type {import("../../../types").Auth} Auth */
	client = {
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
						(await database.findOne({ code: request.body.code })) ?? {};

						if (Date.now() - date > 900000) {
							await database.deleteOne({ code: request.body.code });

							return response.status(410);
						}

						if (request.body.email !== email) return response.status(401);

						await database.deleteOne({ code: request.body.code });

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

						await database.insertOne({ code, date: Date.now(), email: request.body.email });

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
