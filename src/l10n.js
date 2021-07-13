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
 * @param {boolean} [cache] - Whether languages should be loaded from the cache if possible.
 *
 * @returns {string[]} - Resulting array.
 */
export function compileLangs(langs, cache = false) {
	if (cache) {
		const retrieved = CACHE_CODES[`${langs}`];

		if (retrieved) return retrieved;
	}

	CACHE_CODES[`${langs}`] = langs

		// Remove asterisks
		.filter((item) => item !== "*")
		.flatMap((language) => {
			// Standardize character between language and country code
			const standardLang = language.replace(/-/g, "_"),
				// Add language without country code as fallback
				[noCountryLang] = standardLang.split("_");

			return [
				standardLang,
				noCountryLang,

				// Add other countries with the same languages' country codes as fallbacks
				...LANG_CODES.filter((langCode) => langCode.indexOf(`${noCountryLang}`) === 0),
			];
		})

		// Remove duplicates
		.filter((item, index) => CACHE_CODES[`${langs}`]?.indexOf(item || "") === index)

		// Remove undefined values
		.filter((lang) => typeof lang === "string");

	// Add base language as fallback to the fallback
	CACHE_CODES[`${langs}`]?.push(BASE_LANG);
	// Slice it on the base language because the base has all the strings.
	CACHE_CODES[`${langs}`]?.splice((CACHE_CODES[`${langs}`]?.indexOf(BASE_LANG) || 0) + 1);

	return CACHE_CODES[`${langs}`] || [BASE_LANG];
}

/**
 * Get messages in the first avilable language.
 *
 * @param {string[]} langs - Languages to use when searching for messages.
 * @param {boolean} [cache] - Whether to load messages from the cache when possible.
 *
 * @returns {{ [key: string]: string }} - Retrieved messages.
 */
export function getMessages(langs, cache = true) {
	if (cache) {
		const retrieved = CACHE_MSGS[`${langs}`];

		if (retrieved) return retrieved;
	}

	/** @type {{ [key: string]: string }} */
	let msgs = {};

	for (const langCode of langs) msgs = { ...MESSAGES[`${langCode}`], ...msgs };

	CACHE_MSGS[`${langs}`] = msgs;

	return msgs;
}

/**
 * Generates a plural formatter for a specific language.
 *
 * @param {string} lang - Language to generate the formatter for.
 * @param {boolean} [cache] - Whether formatters should be loaded from the cache if possible.
 *
 * @returns {MessageFormatter} - The message formater.
 */
export function getFormatter(lang, cache = true) {
	if (cache) {
		/** @type {MessageFormatter} */
		const retrieved = CACHE_FORMATTERS[`${lang}`];

		if (retrieved) return retrieved;
	}

	CACHE_FORMATTERS[`${lang}`] = new MessageFormatter(lang, {
		plural: pluralTypeHandler,
	}).format;

	return CACHE_FORMATTERS[`${lang}`];
}

/**
 * Parses a string into a language code and optional placeholder data. Renders a translation with them.
 *
 * @param {string} inputInfo - String to parse, including a message code and optional placeholders.
 * @param {string} lang - Language code to be used when retreiving a plural formatter.
 * @param {{ [key: string]: string }} msgs - Messages to be used.
 *
 * @returns {string} - Rendered message.
 * @todo Move rendering out of this function.
 */
function parseMessage(inputInfo, lang, msgs) {
	const [messageCode, ...placeholders] = inputInfo

		// Trim excess whitespace
		.trim()

		// Condense remaining whitespce
		.replace(/\s/gu, " ")

		// Split on `|||`
		.split(/(?<![^\\]\[[^\]]*)(?<!\\)\|{3}/u)

		.map((parameter) =>
			parameter.startsWith("[") && parameter.endsWith("]")
				? parseMessage(parameter.slice(1, -1), lang, msgs)
				: parameter,
		)

		// Handle escaping the `|||` and `[` (prefixing them with a `\`)
		.map((parameter) => parameter.replace(/\\\|{3}/g, "|||").replace(/\\\[/gu, "["));

	return getFormatter(lang)(
		// Get message, fallback to the code provided
		msgs[`${messageCode}`] ?? messageCode,

		// Render it with placeholders
		placeholders,
	);
}

/**
 * Function to be used with Mustache.JS to render messages in templates.
 *
 * @param {string[]} langs - Language to be used when formating plurals.
 * @param {{ [key: string]: string }} [msgs] - Messages to be used.
 *
 * @returns {() => (val: string, render: (val: string) => string) => string} - Function to pass to
 *   Mustache.JS.
 */
export function mustacheFunction(langs, msgs = getMessages(langs)) {
	return () => (value, render) => parseMessage(render(value), `${langs[0]}`, msgs);
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
	let langs;

	if (request.query?.lang) {
		langs = compileLangs([
			// `lang` query parameter overrides everything else
			...(`${request.query?.lang}` ?? "*").split("|"),

			// Fallback to values in cookie
			...(request.cookies?.langs ?? "*").split("|"),

			// Fallback to browser lang
			...accepts(request).languages(),
		]);
	} else if (request.cookies?.langs) {
		// The cookie doesn't need to go through `compileLangs` since it already did
		langs = (request.cookies?.langs ?? "*").split("|");
	} else {
		// This is the default, the broswer langauge.
		langs = compileLangs(accepts(request)?.languages(), true);
	}

	const expires = new Date();

	expires.setFullYear(expires.getFullYear() + 1);
	response.cookie("langs", langs.join("|"), {
		expires,
		maxAge: 31536000000,
		sameSite: false,
	});
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	request.languages = langs;

	const msgs = getMessages(langs);

	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	request.messages = msgs;

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

		placeholders.message = mustacheFunction(langs, msgs);

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
