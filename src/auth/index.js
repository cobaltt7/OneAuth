/** @file Authentication APIs. */

import path from "path";
import url from "url";

import { Router as express } from "express";
import mustache from "mustache";
import retronid from "retronid";

import authClients from "../../lib/clients.js";
import { AuthDatabase, NonceDatabase } from "../../lib/mongoose.js";
import { logError } from "../errors/index.js";

const app = express(),
	directory = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * Returns information about a authentication client.
 *
 * @param {string} requestedClient - Client to retrieve information about.
 *
 * @returns {import("../../types").Auth | undefined} - Information about the client.
 */
function getClient(requestedClient) {
	return authClients.find((currentClient) =>
		currentClient?.pages?.find(({ backendPage }) => backendPage === requestedClient),
	);
}

/**
 * Get HTTP request handlers from a path.
 *
 * @param {string} requestedClient - The path.
 *
 * @returns {import("../../types").Page | void} - The HTTP handlers.
 */
function getPageHandler(requestedClient) {
	for (const currentClient of authClients) {
		const response = currentClient?.pages?.find(
			({ backendPage }) =>
				new URL(`./${backendPage}`, "https://auth.onedot.cf/auth/").pathname ===
				`/${requestedClient}`,
		);

		if (response) return response;
	}

	/**
	 * Hack to fix lint error.
	 *
	 * @type {undefined}
	 */
	let nothing;

	return nothing;
}

app.get("/auth", async (request, response) => {
	if (!request.query?.url) return response.status(400);

	const expires = new Date(),
		nonce = retronid(),
		psuedoNonce = retronid();

	expires.setMinutes(expires.getMinutes() + 15);

	await new NonceDatabase({
		nonce,
		psuedoNonce,
		redirect: request.query.url,
	}).save();

	response.cookie("nonce", psuedoNonce, {});

	return response.render(path.resolve(directory, "auth.html"), {
		clients: authClients.map((client) => ({
			...client,

			link: mustache.render(client.link, {
				nonce,
			}),
		})),
	});
});

app.get("/backend/get_data", async (request, response) => {
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept",
	);

	response
		.status(200)
		.json(await AuthDatabase.findOneAndDelete({ token: request.query?.code }).exec());
});
app.get("/backend/send_data", async (request, response) => {
	if (!request.query) return logError("`request.query` is falsy!");

	const { client, url: redirectUrl = "", token } = request.query,
		clientInfo = getClient(`${client}`);

	if (!clientInfo) return logError(new ReferenceError(`Invalid client: ${client}`));

	let code, redirect;

	if (clientInfo.rawData && !clientInfo.getData) {
		code = `${token}`;
	} else if (!clientInfo.rawData && clientInfo.getData) {
		code = retronid();

		const data = await clientInfo.getData(`${token}`);

		if (!data) return logError("No data available");

		data.client = clientInfo.name;
		await new AuthDatabase({ data, token: code }).save();
	} else {
		return logError(new ReferenceError(`Invalid client: ${client}`));
	}

	try {
		redirect = new URL(`${redirectUrl}`);
		redirect.searchParams.set("code", code);

		return response.status(303).redirect(redirect.href);
	} catch {
		return response.status(400);
	}
});

for (const method of [
	// TODO: support "all",
	"checkout",
	"copy",
	"delete",
	"get",
	"head",
	"lock",
	"merge",
	"mkactivity",
	"mkcol",
	"move",
	"m-search",
	"notify",
	"options",
	"patch",
	"post",
	"purge",
	"put",
	"report",
	"search",
	"subscribe",
	"trace",
	"unlock",
	"unsubscribe",
]) {
	// @ts-expect-error -- TS can't tell that there is a limited set of values for `method`.
	app[`${method}`](
		"*",

		/**
		 * Run the appropriate HTTP request handler on a HTTP request, or return a HTTP error code.
		 *
		 * @param {import("express").Request} request - Express request object.
		 * @param {import("express").Response} response - Express response object.
		 * @param {import("express").NextFunction} next - Express next function.
		 */
		(request, response, next) => {
			const client = getPageHandler(`${request.path.slice(1)}`);

			if (!client) {
				next();

				return;
			}

			/** @type {import("../../types").RequestFunction | undefined} */
			// @ts-expect-error -- TS can't tell that there is a limited set of values for `method`.
			const requestFunction = client[`${method}`];

			if (typeof requestFunction !== "function") {
				response.status(405);

				return;
			}

			requestFunction(
				request,
				response,

				async (tokenOrData, nonce) => {
					const clientInfo = getClient(client.backendPage);

					if (!clientInfo) {
						logError(new ReferenceError(`Invalid client: ${client.backendPage}`));

						return;
					}

					const { psuedoNonce, redirect } = await NonceDatabase.findOneAndDelete({
						nonce,
					}).exec();

					if (!request.cookies.nonce) {
						response.status(401);

						return;
					}

					if (request.cookies.nonce !== psuedoNonce) {
						response.status(403);

						return;
					}

					let data, token;

					if (
						clientInfo.rawData &&
						typeof tokenOrData === "object" &&
						!clientInfo.getData
					) {
						data = tokenOrData;
						data.client = clientInfo.name;
						token = retronid();
						await new AuthDatabase({ data, token }).save();
					} else if (
						!clientInfo.rawData &&
						typeof tokenOrData === "string" &&
						clientInfo.getData
					) {
						// TODO: JWT

						data = `${request.localization.messages["core.allow.hidden"]} ${request.localization.messages["core.allow.sorry"]}`;
						token = tokenOrData;
					} else {
						logError(
							new TypeError(
								`Invalid type passed to sendResponse tokenOrData: ${typeof tokenOrData}`,
							),
						);

						return;
					}

					try {
						const { host } = new URL(redirect);

						response.status(300).render(path.resolve(directory, "allow.html"), {
							client: client.backendPage,
							data: JSON.stringify(data),
							encodedUrl: encodeURIComponent(redirect),
							host,
							name: clientInfo.name,
							token,
						});
					} catch {
						logError(new SyntaxError(`Invalid URL: ${redirect}`));
						response.status(400);
					}
				},
			);
		},
	);
}

export default app;
