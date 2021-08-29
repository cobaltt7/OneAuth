/** @file Localization Of the site. */

import { promises as fileSystem } from "fs";
import path from "path";
import url from "url";

import { MessageFormatter, pluralTypeHandler } from "@ultraq/icu-message-formatter";
import accepts from "accepts";
import matchBrackets from "balanced-match";
import { globby } from "globby";

import { logError } from "../src/errors/index.js";

const BASE_LANGUAGE = "en_US",
	/** @type {{ [key: string]: MessageFormatter }} */
	FORMATTERS_CACHE = {},
	/** @type {{ [key: string]: string[] }} */
	LANGUAGES_CACHE = {},
	/** @type {{ [key: string]: { [key: string]: string } }} */
	MESSAGES_CACHE = {},
	/** @type {Promise<string>[]} */
	messagePromises = [];

/** @type {string[]} */
export const LANGUAGES = [];

/** @type {{ [key: string]: { [key: string]: string } }} */
export const MESSAGES = {};

// Initialize
for (const filename of await globby("_locales/*.json")) {
	// Get all supported languages
	const { code } = /^_locales\/(?<code>.*)\.json$/.exec(filename)?.groups ?? {};

	// Add it to the list
	LANGUAGES.push(`${code}`);

	// Queue the locales file
	messagePromises.push(fileSystem.readFile(url.pathToFileURL(path.resolve(filename)), "utf8"));
}

/**
 * Parse message objects into simpler format.
 *
 * @param {import("../types").StructuredJSON} messages - Messages to load.
 *
 * @returns {{ [key: string]: string }} - Parsed messages.
 */
function parseTranslations(messages) {
	/** @type {{ [key: string]: string }} */
	const returnValue = {};

	for (const key in messages) {
		if (!Object.prototype.hasOwnProperty.call(messages, key)) continue;

		const message = messages[`${key}`];

		// If it's not nested, just add it to the return value.
		if (message?.string) {
			returnValue[`${key}`] = message.string
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, () => {
					logError(
						`The \`${key}\` string (translated as \`${message.string}\`) has non-curly quotes!`,
					);

					return "&quot;";
				})
				.replace(/['`‘]/g, () => {
					logError(
						`The \`${key}\` string (translated as \`${message.string}\`) has non-curly quotes!`,
					);

					return "&#8217;";
				})
				.replace(/\.{3}/g, () => {
					logError(
						`The \`${key}\` string (translated as \`${message.string}\`) contains three dots!`,
					);

					return "…";
				});

			continue;
		}

		if (message.string === "") continue;

		// If it's nested, recursively add it to the return value.
		for (const subKey in message) {
			if (!Object.hasOwnProperty.call(message, subKey) || !message[`${subKey}`]) continue;

			if (typeof message[`${subKey}`]?.string === "string") {
				// Add them to the return value.
				returnValue[`${key}.${subKey}`] = `${message[`${subKey}`]?.string}`
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, () => {
						logError(
							`The \`${key}.${subKey}\` string (translated as \`${
								message[`${subKey}`]?.string
							}\`) has non-curly quotes!`,
						);

						return "&quot;";
					})
					.replace(/['`‘]/g, () => {
						logError(
							`The \`${key}.${subKey}\` string (translated as \`${
								message[`${subKey}`]?.string
							}\`) has non-curly quotes!`,
						);

						return "&#8217;";
					})
					.replace(/\.{3}/g, () => {
						logError(
							`The \`${key}.${subKey}\` string (translated as \`${
								message[`${subKey}`]?.string
							}\`) contains three dots!`,
						);

						return "…";
					});

				continue;
			}

			// Load nested messages.
			// @ts-expect-error -- It's impossible for `message[`${subKey}`]` to be anything but a string
			const subMessages = parseTranslations(message[`${subKey}`]);

			// Iterate over all sub-messages and add them to the return value.
			for (const subSubKey in subMessages) {
				if (!Object.hasOwnProperty.call(subMessages, subSubKey)) continue;

				// Add them to the return value.
				returnValue[`${key}.${subKey}.${subSubKey}`] = subMessages[`${subSubKey}`];
			}
		}
	}

	return returnValue;
}

// Get the translations
for (const [index, rawMessages] of (await Promise.all(messagePromises)).entries())
	MESSAGES[`${LANGUAGES[+index]}`] = parseTranslations(JSON.parse(rawMessages));

/**
 * Expands array of languages to be broader.
 *
 * @param {string[]} languages - Input languages.
 *
 * @returns {string[]} - Resulting array.
 */
function compileLanguages(languages) {
	// Any requests would have to process the whole list. This prevents that for subsequent requests.
	if (LANGUAGES_CACHE[`${languages}`]) return LANGUAGES_CACHE[`${languages}`];

	LANGUAGES_CACHE[`${languages}`] = languages
		// Remove asterisks (asterisks mean "any" in the spec)
		.filter((item) => item !== "*")
		.flatMap((language) => {
			// Standardize character between language and country code
			const standardizedLanguage = language.replace(/-/g, "_"),
				// Add language without country code as fallback
				[noCountryLanguage] = standardizedLanguage.split("_"),
				// Add language without dialect as fallback
				[noDialectLanguage] = standardizedLanguage.split("@");

			return [
				standardizedLanguage,
				noDialectLanguage,
				noCountryLanguage,

				// Add other countries with the same languages' country codes as fallbacks
				...LANGUAGES.filter(
					(languageCode) => languageCode.indexOf(`${noCountryLanguage}`) === 0,
				),
			];
		})

		// Remove duplicates
		.filter(
			/**
			 * If this is the first time the key is found in the array, return true. Otherwise,
			 * return false, removing the duplicate from the array.
			 *
			 * @param {string} item - Key to check.
			 * @param {number} index - Index of the key.
			 * @param {string[]} codes - Array to check against.
			 *
			 * @returns {boolean} - True if the key is the first time it's found in the array, false
			 *   otherwise.
			 */
			(item, index, codes) => codes.indexOf(item) === index,
		)
		// Only output languages we support
		.filter((item) => LANGUAGES.indexOf(item) + 1);

	// Add base language as a last resort
	LANGUAGES_CACHE[`${languages}`].push(BASE_LANGUAGE);

	// Slice it on the base language because the base has all the strings.
	LANGUAGES_CACHE[`${languages}`].splice(
		LANGUAGES_CACHE[`${languages}`].indexOf(BASE_LANGUAGE) + 1,
	);

	return LANGUAGES_CACHE[`${languages}`];
}

/**
 * Generates a plural formatter for a specific language.
 *
 * @param {string} language - Language to generate the formatter for.
 *
 * @returns {MessageFormatter} - The message formater.
 */
export function getFormatter(language) {
	// Use a cached formatter if available.
	if (FORMATTERS_CACHE[`${language}`]) return FORMATTERS_CACHE[`${language}`];

	FORMATTERS_CACHE[`${language}`] = new MessageFormatter(language, {
		plural: pluralTypeHandler,
	}).format;

	return FORMATTERS_CACHE[`${language}`];
}

/**
 * Get all messages, using the first avilable language for each.
 *
 * @param {string[]} languages - Languages to use when searching for messages.
 *
 * @returns {{ [key: string]: string }} - Retrieved messages.
 */
function getMessages(languages) {
	if (MESSAGES_CACHE[`${languages}`]) return MESSAGES_CACHE[`${languages}`];

	MESSAGES_CACHE[`${languages}`] = {};

	for (const languageCode of languages) {
		MESSAGES_CACHE[`${languages}`] = {
			...MESSAGES[`${languageCode}`],
			...MESSAGES_CACHE[`${languages}`],
		};
	}

	return MESSAGES_CACHE[`${languages}`];
}

/**
 * Split on a character not between other characters.
 *
 * Thanks to @CubeyTheCube for code!
 *
 * @param {string} toSplit - String to spltit.
 * @param {string} splitOn - Character to split on.
 * @param {string} notStart - Character that marks the start of a "do not split" section.
 * @param {string} notEnd - Character that marks the end of a "do not split" section.
 *
 * @returns {string[]} - The split string.
 */
function splitOnNotBetween(toSplit, splitOn, notStart, notEnd) {
	let currentValue = "",
		unbalancedParens = 0;

	return Array.from(toSplit)
		.reduce(
			(
				/** @type {string[]} */
				accumulated,
				value,
				index,
			) => {
				if (currentValue[index - 1] === "\\") {
					currentValue += value;
				} else {
					if (value === notStart) unbalancedParens++;
					else if (value === notEnd) unbalancedParens--;

					if (value !== splitOn || unbalancedParens) {
						currentValue += value;
					} else if (value === splitOn && !unbalancedParens) {
						const returnValue = accumulated.concat(currentValue);

						currentValue = "";

						return returnValue;
					}
				}

				return accumulated;
			},
			[],
		)
		.concat(currentValue)
		.map((toUnescape) => toUnescape.replace(new RegExp(`\\\\${splitOn}`, "g"), splitOn));
}

/**
 * Parse and render nested messages.
 *
 * @param {string} variable - Variable to parse.
 * @param {string} language - Language to format plurals with.
 * @param {{ [key: string]: string }} messages - Messages to translate to.
 *
 * @returns {string} - The full rendered message.
 */
function parseNestedMessages(variable, language, messages) {
	const matched = matchBrackets("[", "]", variable);

	if (!matched) return variable;

	return (
		matched.pre +
		// eslint-disable-next-line no-use-before-define -- `renderMessage` and `parseNestedMessages` call each other.
		renderMessage(matched.body, language, messages) +
		parseNestedMessages(matched.post, language, messages)
	);
}

/**
 * Renders a string with a language code and optional variables into a trnaslated message.
 *
 * @param {string} original - String to parse.
 * @param {string} language - Language to format plurals with.
 * @param {{ [key: string]: string }} messages - Messages to translate to.
 *
 * @returns {string} - Rendered message.
 */
function renderMessage(original, language, messages) {
	const formatter = getFormatter(language);

	return splitOnNotBetween(original, ";", "[", "]")
		.map((splitmessage) => {
			const [messageCode, ...placeholders] = splitmessage
				// Trim excess whitespace
				.trim()

				// Condense remaining whitespce
				.replace(/\s/gu, " ")

				// Split the string into the message code and variables
				.split(/(?<![^\\]\[[^\]]+)(?<!\\)\|{3}/u)

				// Handle embedded messages
				.map((variable) => parseNestedMessages(variable, language, messages))

				// Unescape escaped characters
				.map((parameter) => parameter.replace(/\\\|{3}/gu, "|||").replace(/\\\[/gu, "["));

			// Get message
			let message = messages[`${messageCode}`];

			if (!message) {
				// Fallback to the code provided
				message = messageCode;
				logError(`Missing message for ${messageCode}`);
			}

			return formatter(
				message,

				// Render it with placeholders
				placeholders,
			);
		})
		.join(" ")
		.trim();
}

/**
 * Function that can be passed to Mustache.JS to render messages.
 *
 * @example <caption>Usage with `mustache`</caption>
 * 	mustache.render("<p>{{ #message }}aboutClientCount|||{{ clients.length }}</p>", {
 * 		clients,
 * 		message: mustacheFunction(request.localization.languages, request.localization.messages),
 * 	});
 *
 * @example <caption>Usage with `mustache-express`</caption>
 * 	response.render(path.resolve(directory, "./index.html"), {
 * 		message: mustacheFunction(request.localization.languages, request.localization.messages),
 * 	});
 *
 * @param {string[]} languages - Language to be used when formating plurals.
 * @param {{ [key: string]: string }} [messages] - Messages to be used.
 *
 * @returns {() => (val: string, render: (val: string) => string) => string} - Function to pass to
 *   Mustache.JS.
 */
export function mustacheFunction(languages, messages = getMessages(languages)) {
	return () => (value, render) => renderMessage(render(value), `${languages[0]}`, messages);
}

/**
 * Express localization middleware.
 *
 * @param {import("express").Request} request - Express request object.
 * @param {import("express").Response} response - Express response object.
 * @param {import("express").NextFunction} next - Express continue function.
 */
export default function localization(request, response, next) {
	const expires = new Date(),
		languages = compileLanguages(
			// `language` query parameter overrides everything else
			request.query.language
				? `${request.query.language || "*"}`.split("|").concat(
						// Fallback to values in cookie
						(request.cookies.languages || "*").split("|"),

						// Fallback to browser language
						accepts(request).languages(),
				  )
				: request.cookies?.languages
				? (request.cookies.languages || "*").split("|")
				: accepts(request).languages(),
		);

	expires.setFullYear(expires.getFullYear() + 1);

	response.cookie("languages", languages.join("|"), {
		expires,
		httpOnly: false,
		maxAge: 31536000000,
		sameSite: "none",
		secure: true,
		signed: false,
	});

	const messages = getMessages(languages);

	// Save the language and message data in `request` so request handlers can access them.
	request.localization = { languages, messages };

	// Grab reference of render
	const realRender = response.render;

	/**
	 * Override `res.render` to ensure `message` is always available.
	 *
	 * @param {string} view - The file to render.
	 * @param {{ [key: string]: any } | ((error: Error, str: string) => unknown)} [variablesOrCallback]
	 *   - Data to render it with or callback to run after render.
	 *
	 * @param {(error: Error, str: string) => void} [callback] - Callback to run after render.
	 *
	 * @returns {void}
	 */
	response.render = function render(
		view,
		variablesOrCallback = {},
		callback = function (error, string) {
			if (error) return logError(error);

			return response.send(string);
		},
	) {
		const variables = typeof variablesOrCallback === "object" ? variablesOrCallback : {};

		if (variables.message)
			logError(new ReferenceError("The message property is reserved. It will be overriden"));

		variables.message = mustacheFunction(languages, messages);

		// This is used in the footer partial
		if (variables.languages) {
			logError(
				new ReferenceError("The languages property is reserved. It will be overriden"),
			);
		}

		variables.languages = [...languages, ...LANGUAGES]
			// Remove duplicates
			.filter((item, index, codes) => codes.indexOf(item) === index)
			.map((language) => ({
				code: language,
				language: MESSAGES[`${language}`]["footer.localization.thisLanguage"],
			}));

		// Continue with original render
		return realRender.call(
			response,
			view,
			variables,
			// @ts-expect-error -- For some reason TS doesn't like the first parameter?
			typeof variablesOrCallback === "object" ? callback : variablesOrCallback,
		);
	};
	next();
}
