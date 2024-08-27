/** @file Authentication APIs. */

import { createPrivateKey, createPublicKey } from "crypto";
import path from "path";
import url from "url";

import dotenv from "dotenv";
import { Router as express } from "express";
import SignJWT from "jose-node-esm-runtime/jwt/sign";
import jwtVerify from "jose-node-esm-runtime/jwt/verify";
import mongoose from "mongoose";
import mustache from "mustache";
import retronid from "retronid";

import authClients from "../../lib/clients.js";
import { logError } from "../errors/index.js";

dotenv.config();

const app = express(),
	directory = path.dirname(url.fileURLToPath(import.meta.url));

await mongoose.connect(`${process.env.MONGO_URL}?retryWrites=true&w=majority`, {
	appName: "OneAuth",
});

mongoose.connection.on("error", logError);

/**
 * @type {import("mongoose").Model<{
 * 	customClients: {
 * 		icon: string;
 * 		link: string;
 * 		name: string;
 * 		_id: import("mongoose").ObjectId;
 * 	}[];
 * 	disabledClients: string[];
 * 	logo: string;
 * 	redirect: string;
 * 	name: string;
 * 	identifier: string;
 * 	_id: import("mongoose").ObjectId;
 * 	__v: number;
 * }>}
 */
const ConfigDatabase = mongoose.model(
		"Config",
		new mongoose.Schema({
			customClients: [
				{
					icon: {
						lowercase: true,
						required: true,
						type: String,
					},

					link: {
						lowercase: true,
						required: true,
						type: String,
					},

					name: {
						required: true,
						type: String,
					},
				},
			],

			disabledClients: [
				{
					required: true,
					type: String,
				},
			],

			identifier: {
				lowercase: true,
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},

			logo: {
				lowercase: true,
				required: false,
				type: String,
			},

			name: {
				required: true,
				type: String,
			},

			redirect: {
				lowercase: true,
				required: true,
				type: String,
			},
		}),
	),
	JWT_ALGORITHM = "ES256",
	NonceDatabase = mongoose.model(
		"Nonce",
		new mongoose.Schema({
			nonce: {
				lowercase: true,
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},

			parameterUsed: {
				type: Boolean,
			},

			psuedoNonce: {
				lowercase: true,
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},

			redirect: {
				lowercase: true,
				required: true,
				type: String,
			},
		}),
	),
	PRIVATE_KEY = createPrivateKey(
		`${process.env.EC_PRIVATE_KEY_0}\n${process.env.EC_PRIVATE_KEY_1}\n${process.env.EC_PRIVATE_KEY_2}\n${process.env.EC_PRIVATE_KEY_3}\n${process.env.EC_PRIVATE_KEY_4}`,
	),
	PUBLIC_KEY = createPublicKey(
		`${process.env.EC_PUBLIC_KEY_0}\n${process.env.EC_PUBLIC_KEY_1}\n${process.env.EC_PUBLIC_KEY_2}\n${process.env.EC_PUBLIC_KEY_3}`,
	);

// New ConfigDatabase({
// 	CustomClients: [{icon:"https://discord.com/favicon.ico",name:"disc",link:"https://discord.com"}]
// 	, disabledClients: ["Scratch"],
// 	Logo:"",redirect:"http://localhost:3000/backend/get_data",
// 	Identifier:retronid()
// }).save().then(console.log);

app.all("/auth", async (request, response) => {
	const config = request.query.id
		? await ConfigDatabase.findOne({ identifier: `${request.query.id}` })
		: { customClients: [], disabledClients: [], redirect: request.query.url };

	try {
		// eslint-disable-next-line no-new -- There are no side-effects here.
		new URL(`${config.redirect}`);
	} catch {
		response.status(400);

		return logError(new URIError(`Invalid URL: ${config.redirect}`));
	}

	// Set a nonce and a psuedo nonce
	const nonce = retronid(),
		psuedoNonce = retronid();

	// Save the nonces to the database
	await new NonceDatabase({
		nonce,
		parameterUsed: !!request.query.url,
		psuedoNonce,
		redirect: config.redirect,
	}).save();

	// Store the psuedo nonce in a cookie
	const expires = new Date();

	expires.setMinutes(expires.getMinutes() + 15);
	response.cookie("nonce", psuedoNonce, {
		expires,
		httpOnly: true,
		maxAge: 900000,
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		secure: process.env.NODE_ENV === "production",
		signed: false,
	});

	return response.render(path.resolve(directory, "auth.html"), {
		clients: [
			...authClients.filter(({ name }) => !config.disabledClients.includes(name)),
			...config.customClients,
		].map((/** @type {import("../../types").Auth} */ client) => ({
			fontAwesome: client.fontAwesome,
			icon: client.icon,

			link: mustache.render(client.link, {
				nonce,
			}),

			name: client.name,
		})),
	});
});

/** @type {{ [key: string]: undefined | import("../../types").Page }} */
const clientsByPage = Object.assign({}, ...authClients.map(({ pages }) => pages));

for (const [page, handlers] of Object.entries(clientsByPage)) {
	app.all(new URL(page, "https://auth.onedot.cf/auth/").pathname, (request, response, next) => {
		/** @type {import("../../types").RequestFunction | undefined} */
		// @ts-expect-error -- TS doesn't know that there is a limited set of values for `request.method`.
		const handler = handlers?.all || handlers?.[`${request.method.toLowerCase()}`];

		if (typeof handler !== "function") return response.status(405);

		/**
		 * Handle redirecting the user after authentication finishes.
		 *
		 * @type {import("../../types").SendResponse}
		 */
		const sendResponse = async (data, nonce) => {
			// Check nonce
			const { redirect, parameterUsed } =
				(await NonceDatabase.findOneAndDelete({
					nonce,
					psuedoNonce: request.cookies.nonce,
				}).exec()) || {};

			if (!redirect) return response.status(403);

			// Get client info
			const client = authClients.find(({ pages }) => pages[`${page}`]);

			if (!client) return next();

			/**
			 * @type {{ [key: string]: any; client: string }}
			 * @todo Make a standard.
			 */
			const processedData = { ...data, client: client.name };

			if (parameterUsed) {
				if (typeof processedData.error === "string") processedData.error += " ";
				else processedData.error = "";

				processedData.error +=
					"Deprecation warning [ACTION REQUIRED]: Configuring the redirect URL with a query parameter is deprecated and will soon be removed. Please update to the new dashboard configuration instead.";
			}

			// Get data
			// TODO: encrypt and salt.
			const jwt = await new SignJWT(processedData)
				.setExpirationTime("15 minutes")
				.setIssuedAt()
				.setIssuer("OneDot")
				// .setSubject(name)
				.setProtectedHeader({ alg: JWT_ALGORITHM })
				.sign(PRIVATE_KEY);

			// Render allow page
			try {
				// TODO: get url from db
				const redirectUrl = new URL(redirect);

				redirectUrl.searchParams.set("token", jwt);

				return response._status(300).render(path.resolve(directory, "allow.html"), {
					allowUrl: redirectUrl,
					client: client.name,

					data: JSON.stringify({
						payload: processedData,
						protectedHeader: { alg: JWT_ALGORITHM },
					}),

					denyUrl: redirectUrl,
					host: redirectUrl.host,
				});
			} catch {
				response.status(400);

				return logError(new URIError(`Invalid url: ${redirect}`));
			}
		};

		return handler.call(
			{
				sendResponse,
			},
			request,
			response,
			(error) => {
				if (error) return next(error);

				/** @type {import("../../types").RequestFunction | undefined} */
				// @ts-expect-error -- TS doesn't know that there is a limited set of values for `request.method`.
				const nextHandler = handlers[`${request.method.toLowerCase()}`];

				if (handlers?.all && nextHandler) {
					return nextHandler.call(
						{
							sendResponse,
						},
						request,
						response,
						next,
					);
				}

				return next(error);
			},
		);
	});
}

app.all("/backend/get_data", (request, response) => {
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept",
	);

	// Todo: check issued to
	return jwtVerify(`${request.query.token}`, PUBLIC_KEY, {
		algorithms: [JWT_ALGORITHM],
		issuer: "OneDot",
		maxTokenAge: "15 minutes",
	})
		.then((data) => response.json(data))
		.catch((error) => {
			response.status(401);

			return logError(error);
		});
});

export default app;
