/** @file Authentication APIs. */

import path from "path";
import url from "url";

import ReplitDB from "@replit/database";
import { Router as express } from "express";
import globby from "globby";
import retronid from "retronid";

import { logError } from "../errors/index.js";

const app = express(),
	/**
	 * @type {{
	 * 	fontawesome: boolean;
	 * 	icon: string;
	 * 	iconProvider: string;
	 * 	link: string;
	 * 	name: string;
	 * 	svg: boolean;
	 * }[]}
	 */
	authButtons = [],
	/** @type {import("../../types").Auth[]} */
	authClients = [],
	clientPromises = [],
	database = new ReplitDB(),
	directory = path.dirname(url.fileURLToPath(import.meta.url)),
	// Idk why this is relative to the root dir but it is
	paths = await globby("src/auth/*/index.js");

for (const filepath of paths) clientPromises.push(import(`../../${filepath}`));

for (const { default: client } of await Promise.all(clientPromises)) {
	authClients.push(client);
	authButtons.push({
		fontawesome: client.iconProvider.indexOf("fa") === 0,
		icon: client.icon,
		iconProvider: client.iconProvider,
		link: client.link,
		name: client.name,
		svg: client.iconProvider === "svg",
	});
}

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
 * Get HTTP request handlers from a page name.
 *
 * @param {string} requestedClient - The page name.
 *
 * @returns {import("../../types").Page} - The HTTP handlers.
 */
function getPageHandler(requestedClient) {
	for (const currentClient of authClients) {
		const response = currentClient?.pages?.find(
			({ backendPage }) => backendPage === requestedClient,
		);

		if (response) return response;
	}

	return { backendPage: requestedClient };
}

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
		"/:client",

		/**
		 * Run the appropriate HTTP request handler on a HTTP request, or return a HTTP error code.
		 *
		 * @param {import("express").Request} request - Express request object.
		 * @param {import("express").Response} response - Express response object.
		 */
		(request, response) => {
			const client = getPageHandler(`${request.params?.client}`);

			if (Object.keys(client).length === 1) {
				response.status(404);

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

				(tokenOrData, redirect) => {
					const clientInfo = getClient(request.params?.client || "");

					if (!clientInfo) {
						return logError(
							new ReferenceError(`Invalid client: ${request.params?.client}`),
						);
					}

					let data, token;

					if (clientInfo.rawData && typeof tokenOrData === "object") {
						data = tokenOrData;
						data.client = clientInfo.name;
						token = retronid.generate();
						database.set(`RETRIEVE_${token}`, data);
					} else if (!clientInfo.rawData && typeof tokenOrData === "string") {
						data = request.messages.allowDataHidden;
						token = tokenOrData;
					} else {
						logError(
							new TypeError(
								`Invalid type passed to sendResponse tokenOrData: ${typeof tokenOrData}`,
							),
						);
					}

					try {
						const { host } = new URL(redirect);

						return response.status(300).render(path.resolve(directory, "allow.html"), {
							client: request.params?.client,
							data: JSON.stringify(data),
							encodedUrl: encodeURIComponent(redirect),
							host,
							name: clientInfo.name,
							token,
							url: redirect,
						});
					} catch {
						return response.status(400);
					}
				},
			);
		},
	);
}

app.get("/", (request, response) => {
	if (!request.query?.url) return response.status(400);

	const authButtonsReplaced = authButtons;

	for (const [index, { link }] of authButtons.entries()) {
		if (authButtonsReplaced[+index]) {
			authButtonsReplaced[+index].link = link.replace(
				// TODO: Use mustache instead. mustache-format-ignore
				/{{\s*url\s*}}/g,
				encodeURIComponent(`${request.query?.url}`),
			);
		}
	}

	return response.render(path.resolve(directory, "auth.html"), {
		clients: authButtonsReplaced,
	});
});

app.get("/backend/get_data", async (request, response) => {
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept",
	);

	response.status(200).json(await database.get(`RETRIEVE_${request.query?.code}`));
	database.delete(`RETRIEVE_${request.query?.code}`);
});
app.get("/backend/send_data", async (request, response) => {
	if (!request.query) return logError("`request.query` is falsy!");

	const { client, url: redirectUrl = "", token } = request.query,
		clientInfo = getClient(`${client}`);

	let code, redirect;

	if (clientInfo?.rawData) {
		code = token;
	} else if (clientInfo?.getData) {
		code = retronid.generate();

		const data = await clientInfo.getData(`${token}`);

		if (!data) return logError("No data available");

		data.client = clientInfo.name;
		database.set(`RETRIEVE_${code}`, data);
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

export default app;
