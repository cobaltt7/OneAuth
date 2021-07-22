/** @file Localization Of the site. */

import fileSystem from "fs";
import path from "path";
import url from "url";

import { MessageFormatter, pluralTypeHandler } from "@ultraq/icu-message-formatter";
import accepts from "accepts";
import globby from "globby";

import { logError } from "./errors/index.js";

const BASE_LANG = "en_US",
	/** @type {{ [key: string]: string[] }} */
	CACHE_CODES = {},
	/** @type {{ [key: string]: MessageFormatter }} */
	CACHE_FORMATTERS = {},
	/** @type {{ [key: string]: { [key: string]: string } }} */
	CACHE_MSGS = {},
	/** @type {string[]} */
	LANG_CODES = [],
	/** @type {{ [key: string]: { [key: string]: string } }} */
	MESSAGES = {},
	messagePromises = [];

for (const filename of await globby("_locales/*.json")) {
	const [, code = BASE_LANG] = filename.split(".")[0]?.split("/") ?? [];

	LANG_CODES.push(`${code}`);

	MESSAGES[`${code}`] = {};

	messagePromises.push(
		fileSystem.readFileSync(url.pathToFileURL(path.resolve(filename)), "utf8"),
	);
}

for (const [index, messages] of (await Promise.all(messagePromises)).entries()) {
	/** @type {{ [key: string]: { [key: string]: string; string: string } }} */
	const rawMessages = JSON.parse(messages) || {};

	for (const item in rawMessages) {
		if (Object.prototype.hasOwnProperty.call(rawMessages, item)) {
			if (!rawMessages[`${item}`]?.string) continue;

			MESSAGES[`${LANG_CODES[+index]}`][`${item}`] = `${rawMessages[`${item}`]?.string}`;
		}
	}
}

/**
 * Expands array of languages to be broader.
 *
 * @param {string[]} langs - Input languages.
 * @param languages
 * @param {boolean} [cache] - Whether languages should be loaded from the cache if possible.
 *
 * @returns {string[]} - Resulting array.
 */
export function compileLangs(languages, cache = false) {
	if (cache) {
		const retrieved = CACHE_CODES[`${languages}`];

		if (retrieved) return retrieved;
	}

	CACHE_CODES[`${languages}`] = languages

		// Remove asterisks
		.filter((item) => item !== "*")
		.flatMap((language) => {
			// Standardize character between language and country code
			const standardLanguage = language.replace(/-/g, "_"),
				// Add language without country code as fallback
				[noCountryLanguage] = standardLanguage.split("_");

			return [
				standardLanguage,
				noCountryLanguage,

				// Add other countries with the same languages' country codes as fallbacks
				...LANG_CODES.filter(
					(languageCode) => languageCode.indexOf(`${noCountryLanguage}`) === 0,
				),
			];
		})

		// Remove duplicates
		.filter((item, index) => CACHE_CODES[`${languages}`]?.indexOf(item || "") === index)

		// Remove undefined values
		.filter((language) => typeof language === "string");

	// Add base language as fallback to the fallback
	CACHE_CODES[`${languages}`]?.push(BASE_LANG);
	// Slice it on the base language because the base has all the strings.
	CACHE_CODES[`${languages}`]?.splice((CACHE_CODES[`${languages}`]?.indexOf(BASE_LANG) || 0) + 1);

	return CACHE_CODES[`${languages}`] || [BASE_LANG];
}

/**
 * Get messages in the first avilable language.
 *
 * @param {string[]} langs - Languages to use when searching for messages.
 * @param languages
 * @param {boolean} [cache] - Whether to load messages from the cache when possible.
 *
 * @returns {{ [key: string]: string }} - Retrieved messages.
 */
export function getMessages(languages, cache = true) {
	if (cache) {
		const retrieved = CACHE_MSGS[`${languages}`];

		if (retrieved) return retrieved;
	}

	/** @type {{ [key: string]: string }} */
	let messages = {};

	for (const languageCode of languages)
		messages = { ...MESSAGES[`${languageCode}`], ...messages };

	CACHE_MSGS[`${languages}`] = messages;

	return messages;
}

/**
 * Generates a plural formatter for a specific language.
 *
 * @param {string} lang - Language to generate the formatter for.
 * @param language
 * @param {boolean} [cache] - Whether formatters should be loaded from the cache if possible.
 *
 * @returns {MessageFormatter} - The message formater.
 */
export function getFormatter(language, cache = true) {
	if (cache) {
		/** @type {MessageFormatter} */
		const retrieved = CACHE_FORMATTERS[`${language}`];

		if (retrieved) return retrieved;
	}

	CACHE_FORMATTERS[`${language}`] = new MessageFormatter(language, {
		plural: pluralTypeHandler,
	}).format;

	return CACHE_FORMATTERS[`${language}`];
}

/**
 * Parses a string into a language code and optional placeholder data. Renders a translation with them.
 *
 * @param {string} inputInfo - String to parse, including a message code and optional placeholders.
 * @param {string} lang - Language code to be used when retreiving a plural formatter.
 * @param language
 * @param {{ [key: string]: string }} msgs - Messages to be used.
 * @param messages
 *
 * @returns {string} - Rendered message.
 * @todo Move rendering out of this function.
 */
function parseMessage(inputInfo, language, messages) {
	const [messageCode, ...placeholders] = inputInfo

		// Trim excess whitespace
		.trim()

		// Condense remaining whitespce
		.replace(/\s/gu, " ")

		// Split on `|||`
		.split(/(?<![^\\]\[[^\]]*)(?<!\\)\|{3}/u)

		.map((parameter) =>
			parameter.startsWith("[") && parameter.endsWith("]")
				? parseMessage(parameter.slice(1, -1), language, messages)
				: parameter,
		)

		// Handle escaping the `|||` and `[` (prefixing them with a `\`)
		.map((parameter) => parameter.replace(/\\\|{3}/g, "|||").replace(/\\\[/gu, "["));

	return getFormatter(language)(
		// Get message, fallback to the code provided
		messages[`${messageCode}`] ?? messageCode,

		// Render it with placeholders
		placeholders,
	);
}

/**
 * Function to be used with Mustache.JS to render messages in templates.
 *
 * @param {string[]} langs - Language to be used when formating plurals.
 * @param languages
 * @param {{ [key: string]: string }} [msgs] - Messages to be used.
 * @param messages
 *
 * @returns {() => (val: string, render: (val: string) => string) => string} - Function to pass to
 *   Mustache.JS.
 */
export function mustacheFunction(languages, messages = getMessages(languages)) {
	return () => (value, render) => parseMessage(render(value), `${languages[0]}`, messages);
}
/**
 * Express l10n middleware.
 *
 * @param {import("express").Request} request - Express request object.
 * @param {import("express").Response} response - Express response object.
 * @param {import("express").NextFunction} next - Express continue function.
 */
export default function localization(request, response, next) {
	/** @type {string[]} */
	let languages;

	if (request.query?.lang) {
		languages = compileLangs([
			// `lang` query parameter overrides everything else
			...(`${request.query?.lang}` ?? "*").split("|"),

			// Fallback to values in cookie
			...(request.cookies?.langs ?? "*").split("|"),

			// Fallback to browser lang
			...accepts(request).languages(),
		]);
	} else if (request.cookies?.langs) {
		// The cookie doesn't need to go through `compileLangs` since it already did
		languages = (request.cookies?.langs ?? "*").split("|");
	} else {
		// This is the default, the broswer langauge.
		languages = compileLangs(accepts(request)?.languages(), true);
	}

	const expires = new Date();

	expires.setFullYear(expires.getFullYear() + 1);
	response.cookie("langs", languages.join("|"), {
		expires,
		maxAge: 31536000000,
		sameSite: false,
	});
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	request.languages = languages;

	const messages = getMessages(languages);

	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	request.messages = messages;

	// Grab reference of render
	const realRender = response.render;

	/**
	 * Override res.render to ensure `message` is always available.
	 *
	 * @param {string} view - The file to render.
	 * @param {{ [key: string]: any } | ((error: Error, str: string) => undefined)} [placeholderCallback]
	 *   - Data to render it with or callback to run after render.
	 *
	 * @param {(error: Error, str: string) => void} [callback] - Callback to run after render.
	 *
	 * @returns {void}
	 */
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	response.render = function render(
		view,
		placeholderCallback = {},
		callback = function (error, string) {
			if (error) return logError(error);

			return response.send(string);
		},
	) {
		const placeholders = typeof placeholderCallback === "object" ? placeholderCallback : {};

		placeholders.message = mustacheFunction(languages, messages);

		// Continue with original render
		return realRender.call(
			response,
			view,
			placeholders,

			// @ts-expect-error -- TS doesn't like the first param, but it is needed.
			typeof placeholderCallback === "function" ? placeholderCallback : callback,
		);
	};
	next();
}
