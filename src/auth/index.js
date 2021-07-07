/** @file Authentication APIs. */

import ReplitDB from "@replit/database";
const database = new ReplitDB();
import globby from "globby";
import { resolve, dirname } from "node:path";
import retronid from "retronid";
import { logError } from "../errors/index.js";
import { Router } from "express";
import url from "node:url";

const directory = dirname(url.fileURLToPath(import.meta.url));
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
const authButtons = [],
	/** @type {import("../../types").Auth[]} */
	authClients = [],
	router = Router();

// Idk why this is relative to the root dir but it is
const paths = await globby("src/auth/*/index.js");

for (const filepath of paths) {
	const client = (await import("../../" + filepath)).default;

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
	router[`${method}`](
		"/:client",

		/**
		 * Run the appropriate HTTP request handler on a HTTP request, or return a HTTP error code.
		 *
		 * @param {e.Request} request - Express request object.
		 * @param {e.Response} response - Express response object.
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

				(tokenOrData, url) => {
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
					} else if (typeof tokenOrData === "string") {
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
						const { host } = new URL(url);

						return response.status(300).render(resolve(directory, "allow.html"), {
							client: request.params?.client,
							data: JSON.stringify(data),
							encodedUrl: encodeURIComponent(url),
							host,
							name: clientInfo.name,
							token,
							url,
						});
					} catch {
						return response.status(400);
					}
				},
			);
		},
	);
}

router.get(
	"/",

	/**
	 * Send the authentication entry page.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {e.Response | undefined} - Express response object.
	 */
	(request, response) => {
		if (!request.query?.url) return response.status(400);

		const authButtonsReplaced = authButtons;

		for (const [index, { link }] of authButtons.entries()) {
			if (authButtonsReplaced[+index]) {
				// @ts-expect-error -- TS thinks `authButtonsReplaced[index]` might be `undefined`. That's impossible. See L211
				authButtonsReplaced[+index].link = link.replace(
					// TODO: Use mustache instead. mustache-format-ignore
					/{{\s*url\s*}}/g,
					encodeURIComponent(`${request.query?.url}`),
				);
			}
		}

		return response.render(resolve(directory, "auth.html"), {
			clients: authButtonsReplaced,
		});
	},
);

router.get(
	"/backend/get_data",

	/**
	 * Retrieve the user's data.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {Promise<void>}
	 */
	async (request, response) => {
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept",
		);

		response.status(200).json(await database.get(`RETRIEVE_${request.query?.code}`));
		database.delete(`RETRIEVE_${request.query?.code}`);
	},
);
router.get(
	"/backend/send_data",

	/**
	 * Save the user's data.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {Promise<e.Response | void>} - Nothing of interest.
	 */
	async (request, response) => {
		if (!request.query) return logError("`request.query` is falsy!");

		const { client, url = "", token } = request.query,
			clientInfo = getClient(`${client}`);

		if (!clientInfo?.getData) return logError(new ReferenceError(`Invalid client: ${client}`));

		let code, redirect;

		if (clientInfo.rawData) {
			code = token;
		} else {
			code = retronid.generate();

			const data = await clientInfo.getData(`${token}`);

			if (!data) return logError("No data available");

			data.client = clientInfo.name;
			database.set(`RETRIEVE_${code}`, data);
		}

		try {
			redirect = new URL(url);
			redirect.searchParams.set("code", code);

			return response.status(303).redirect(redirect);
		} catch {
			return response.status(400);
		}
	},
);

export default router;
