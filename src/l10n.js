/** @file Localization Of the site. */

import { promises as fileSystem } from "fs";
import path from "path";
import url from "url";

import { MessageFormatter, pluralTypeHandler } from "@ultraq/icu-message-formatter";
import accepts from "accepts";
import matchBrackets from "balanced-match";
import globby from "globby";

import { logError } from "./errors/index.js";

const BASE_LANGUAGE = "en_US",
	/** @type {{ [key: string]: string[] }} */
	LANGUAGE_CODE_CACHE = {},
	/** @type {{ [key: string]: MessageFormatter }} */
	FORMATTERS_CACHE = {},
	/** @type {{ [key: string]: { [key: string]: string } }} */
	MESSAGE_CACHE = {},
	/** @type {{ [key: string]: { [key: string]: string } }} */
	MESSAGES = {},
	/** @type {Promise<string>[]} */
	messagePromises = [];

/** @type {string[]} */
export const LANGUAGE_CODES = [];

// Initialize
for (const filename of await globby("_locales/*.json")) {
	// Get all supported languages
	const [, code] = /^_locales\/(.*)\.json$/.exec(filename) || [];

	// Add it to the list
	LANGUAGE_CODES.push(`${code}`);

	// Queue the locales file
	messagePromises.push(fileSystem.readFile(url.pathToFileURL(path.resolve(filename)), "utf8"));
}

/**
 * @param {import("../types").StructuredJSON} messages
 *
 * @returns {{ [key: string]: string }}
 * @todo Support nested properties.
 */
function loadTranslations(messages) {
	/** @type {{ [key: string]: string }} */
	const returnValue = {};

	for (const key in messages)
		if (Object.prototype.hasOwnProperty.call(messages, key)) {
			// If it's not nested, just add it to the return value.
			const message = messages[`${key}`];
			if (typeof message?.string !== "undefined") returnValue[`${key}`] = message.string;
			// If it's nested, recursively add it to the return value.
			else
				for (const subMessageKey in message)
					if (Object.hasOwnProperty.call(message, subMessageKey)) {
						// Load nested messages.
						const subMessages =
							typeof message[`${subMessageKey}`]?.string === "string"
								? message[`${subMessageKey}`]?.string
								: //@ts-expect-error -- It's impossible for `message[`${subMessageKey}`]` to be undefined.
								  loadTranslations(message[`${subMessageKey}`]);

						if (typeof subMessages === "string") {
							// Add them to the return value.
							returnValue[`${key}.${subMessageKey}`] = subMessages;
						} else {
							// Iterate over all sub-messages and add them to the return value.
							for (const subMessageKey2 in subMessages) {
								if (Object.hasOwnProperty.call(subMessages, subMessageKey2)) {
									// Add them to the return value.
									//@ts-expect-error -- It's only possible for `subMessages[`${subMessageKey2}`]` to be a string.
									returnValue[`${key}.${subMessageKey}.${subMessageKey2}`] =
										subMessages[`${subMessageKey2}`];
								}
							}
						}
					}
		}

	return returnValue;
}

// Get the translations
for (const [index, rawMessages] of (await Promise.all(messagePromises)).entries())
	MESSAGES[`${LANGUAGE_CODES[+index]}`] = loadTranslations(JSON.parse(rawMessages));

/**
 * Expands array of languages to be broader.
 *
 * @param {string[]} languages - Input languages.
 *
 * @returns {string[]} - Resulting array.
 */
function compileLanguages(languages) {
	// Any requests would have to process the whole list. This prevents that for subsequent requests.
	if (LANGUAGE_CODE_CACHE[`${languages}`]) return LANGUAGE_CODE_CACHE[`${languages}`];

	LANGUAGE_CODE_CACHE[`${languages}`] = languages
		// Remove asterisks (asterisks mean "any" in the spec)
		.filter((item) => item !== "*")
		.flatMap((language) => {
			// Standardize character between language and country code
			const standardizedLanguage = language.replace(/-/g, "_"),
				// Add language without country code as fallback
				[noCountryLanguage] = standardizedLanguage.split("_");

			return [
				standardizedLanguage,
				noCountryLanguage,

				// Add other countries with the same languages' country codes as fallbacks
				...LANGUAGE_CODES.filter(
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
		);

	// Add base language as a last resort
	LANGUAGE_CODE_CACHE[`${languages}`].push(BASE_LANGUAGE);

	// Slice it on the base language because the base has all the strings.
	LANGUAGE_CODE_CACHE[`${languages}`].splice(
		LANGUAGE_CODE_CACHE[`${languages}`].indexOf(BASE_LANGUAGE) + 1,
	);

	return LANGUAGE_CODE_CACHE[`${languages}`];
}

/**
 * Get all messages, using the first avilable language for each.
 *
 * @param {string[]} languages - Languages to use when searching for messages.
 *
 * @returns {{ [key: string]: string }} - Retrieved messages.
 */
function getMessages(languages) {
	if (MESSAGE_CACHE[`${languages}`]) return MESSAGE_CACHE[`${languages}`];

	/** @type {{ [key: string]: string }} */
	let messages = {};

	for (const languageCode of languages)
		messages = { ...MESSAGES[`${languageCode}`], ...messages };

	return (MESSAGE_CACHE[`${languages}`] = messages);
}

/**
 * @param {string} variable - Variable to parse.
 * @param {string} language - Language to format plurals with.
 * @param {{ [key: string]: string }} messages - Messages to translate to.
 *
 * @returns {string}
 */
function parseNestedVariables(variable, language, messages) {
	const matched = matchBrackets("[", "]", variable);
	if (!matched) return variable;

	return (
		matched.pre +
		renderMessage(matched.body, language, messages) +
		parseNestedVariables(matched.post, language, messages)
	);
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

	return (FORMATTERS_CACHE[`${language}`] = new MessageFormatter(language, {
		plural: pluralTypeHandler,
	}).format);
}

/**
 * Split on a character not between other characters.
 *
 * Thanks to @CubeyTheCube for code!
 *
 * @param {string} string - String to spltit.
 * @param {string} splitOn - Character to split on.
 * @param {string} notStart - Character that marks the start of a "do not split" section.
 * @param {string} notEnd - Character that marks the end of a "do not split" section.
 *
 * @returns {string[]} - The split string.
 * @todo Handle escaped characters.
 */
function splitOnNotBetween(string, splitOn, notStart, notEnd) {
	let unbalancedParens = 0,
		currentValue = "";

	return [...string]
		.reduce((accum, val, index) => {
			if (currentValue[index - 1] === "\\") {
				currentValue += val;
			} else {
				if (val === notStart) unbalancedParens++;
				else if (val === notEnd) unbalancedParens--;

				if (val !== splitOn || unbalancedParens) currentValue += val;
				else if (val === splitOn && !unbalancedParens) {
					const tmp = currentValue;
					currentValue = "";
					return accum.concat(tmp);
				}
			}
			return accum;
		}, [])
		.concat(currentValue)
		.map((string) => string.replace(/\\;/g, ";"));
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

				//Split the string into the message code and variables
				.split(/(?<![^\\]\[[^\]]+)(?<!\\)\|{3}/iu)

				// Handle embedded messages
				.map((variable) => parseNestedVariables(variable, language, messages))

				// Unescape escaped characters
				.map((parameter) => parameter.replace(/\\\|{3}/gu, "|||").replace(/\\\[/gu, "["));

			return formatter(
				// Get message, fallback to the code provided
				messages[`${messageCode}`] || messageCode,

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
 * @example
 * 	mustache.render("<p>{{ #message }}aboutClientCount|||{{ clients.length }}</p>", {
 * 		clients,
 * 		message: mustacheFunction(request.localization.languages, request.localization.messages),
 * 	});
 *
 * @example
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
	const languages = compileLanguages(
		request.query.language
			? [
					// `language` query parameter overrides everything else
					...`${request.query.language || "*"}`.split("|"),

					// Fallback to values in cookie
					...(request.cookies.languages || "*").split("|"),

					// Fallback to browser language
					...accepts(request).languages(),
			  ]
			: request.cookies?.languages
			? (request.cookies.languages || "*").split("|")
			: accepts(request).languages(),
	);

	// Save the language data in a cookie that expires in 1 year.
	const expires = new Date();
	expires.setFullYear(expires.getFullYear() + 1);

	response.cookie("languages", languages.join("|"), {
		expires,
		maxAge: 31536000000,
		sameSite: false,
	});

	const messages = getMessages(languages);

	// Save the language and message data in `request` so request handlers can access them.
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
	request.localization = { languages, messages };

	// Grab reference of render
	const realRender = response.render;

	/**
	 * Override `res.render` to ensure `message` is always available.
	 *
	 * @param {string} view - The file to render.
	 * @param {{ [key: string]: any } | ((error: Error, str: string) => undefined)} [variablesOrCallback]
	 *   - Data to render it with or callback to run after render.
	 *
	 * @param {(error: Error, str: string) => void} [callback] - Callback to run after render.
	 *
	 * @returns {void}
	 */
	// eslint-disable-next-line no-param-reassign -- We need to override the original.
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
			logError(new ReferenceError(`The message property is reserved. It will be overriden`));
		variables.message = mustacheFunction(languages, messages);

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
