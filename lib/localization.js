/** @file Localization Of the site. */

import { promises as fileSystem } from "fs";
import path from "path";
import url from "url";

import { MessageFormatter, pluralTypeHandler } from "@ultraq/icu-message-formatter";
import accepts from "accepts";
import matchBrackets from "balanced-match";
import { globby } from "globby";

import { logError } from "../src/errors/index.js";

// Config
const BASE_LANGUAGE = "en_US",
	FOLDER = "_locales",
	NESTED_WRAPPER = ["[", "]"],
	SEPERATORS = {
		language: "|",
		message: ";",
		placeholder: "|||",
	};

/** @type {string[]} */
export const LANGUAGES = [],
	/** @type {{ [key: string]: undefined | { [key: string]: undefined | string } }} */
	MESSAGES = {};

// Caches
/** @type {{ [key: string]: undefined | MessageFormatter }} */
const FORMATTERS_CACHE = {},
	/** @type {{ [key: string]: undefined | string[] }} */
	LANGUAGES_CACHE = {},
	/** @type {{ [key: string]: undefined | { [key: string]: undefined | string } }} */
	MESSAGES_CACHE = {},
	/** @type {Promise<string>[]} */
	messagePromises = [];

// Initialize
for (const filename of await globby(`${FOLDER}/*.json`)) {
	// Get all supported languages
	const { code } = new RegExp(`^${FOLDER}\/(?<code>.*)\.json$`).exec(filename)?.groups ?? {};

	// Add it to the list
	LANGUAGES.push(`${code}`);

	// Queue the locales file
	messagePromises.push(fileSystem.readFile(url.pathToFileURL(path.resolve(filename)), "utf8"));
}

/**
 * Escape a message.
 *
 * @param {string} key - Key of the message.
 * @param {import("../types").StructuredMessage} arg0 - Message to escape.
 *
 * @returns {string} - Escaped message.
 */
function escapeMessage(key, { string }) {
	/**
	 * Log about invalid characters in the message.
	 *
	 * @param {string} invalid - Invalid character description.
	 *
	 * @returns {void}
	 */
	function logInvalid(invalid) {
		return logError(`The \`${key}\` string (translated as \`${string}\`) contains ${invalid}!`);
	}

	const escaped = string
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, () => {
			logInvalid("non-curly double quotes");

			return "&quot;";
		})
		.replace(/['`‘]/g, () => {
			logInvalid("non-curly single quotes");

			return "&#8217;";
		})
		.replace(/\.{3}/g, () => {
			logInvalid("triple dots");

			return "…";
		});

	return !escaped || escaped.includes("{}") ? "" : escaped;
}

/**
 * Parse message objects into simpler format.
 *
 * @param {import("../types").StructuredJSON} messages - Messages to load.
 *
 * @returns {{ [key: string]: undefined | string }} - Parsed messages.
 */
function parseTranslations(messages) {
	/** @type {{ [key: string]: undefined | string }} */
	const returnValue = {};

	for (const key in messages) {
		if (!Object.prototype.hasOwnProperty.call(messages, key)) continue;

		const message = messages[`${key}`];

		// If it's not nested, just add it to the return value.
		if (typeof message?.string === "string") {
			// @ts-expect-error -- `message` must be a structured message.
			const escaped = escapeMessage(`${key}`, message);

			if (escaped) returnValue[`${key}`] = escaped;

			continue;
		}

		// If it's nested, recursively add it to the return value.
		for (const subKey in message) {
			if (!Object.hasOwnProperty.call(message, subKey) || !message[`${subKey}`]) continue;

			const subMessage = message[`${subKey}`];

			if (typeof subMessage?.string === "string") {
				// @ts-expect-error -- `subMessage` must be a structured message.
				const escaped = escapeMessage(`${key}.${subKey}`, subMessage);

				if (escaped) returnValue[`${key}.${subKey}`] = escaped;

				continue;
			}

			// Load nested messages.
			// @ts-expect-error -- It's impossible for `subMessage` to be anything but structured JSON.
			const subMessages = parseTranslations(subMessage);

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
	if (LANGUAGES_CACHE[`${languages}`]) {
		return (
			LANGUAGES_CACHE[`${languages}`]?.filter((language) => typeof language === "string") || [
				BASE_LANGUAGE,
			]
		);
	}

	const returnValue = languages
		// Remove asterisks (asterisks mean "any" in the spec)
		.filter((item) => item !== "*")
		// Standardize character between language and country code
		.map((language) => language.replace(/-/g, "_"))
		.flatMap((language) => {
			// Add language without country code as fallback
			const [noCountryLanguage] = language.split("_");

			return [
				language,
				// Add language without dialect as fallback
				language.split("@")[0],
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
		.filter((item) => LANGUAGES.indexOf(item) + 1) || [BASE_LANGUAGE];

	// Add base language as a last resort
	returnValue.push(BASE_LANGUAGE);

	// Slice it on the base language because the base has all the strings.
	returnValue.splice(returnValue.indexOf(BASE_LANGUAGE) + 1);

	LANGUAGES_CACHE[`${languages}`] = returnValue;

	return returnValue;
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
 * @returns {{ [key: string]: undefined | string }} - Retrieved messages.
 */
function getMessages(languages) {
	if (MESSAGES_CACHE[`${languages}`]) return MESSAGES_CACHE[`${languages}`] || {};

	MESSAGES_CACHE[`${languages}`] = {};

	for (const languageCode of languages) {
		MESSAGES_CACHE[`${languages}`] = {
			...MESSAGES[`${languageCode}`],
			...MESSAGES_CACHE[`${languages}`],
		};
	}

	return MESSAGES_CACHE[`${languages}`] || {};
}

/**
 * Split on a character not between other characters.
 *
 * @author @CubeyTheCube
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
 * @param {{ [key: string]: undefined | string }} [messages] - Messages to translate to.
 *
 * @returns {string} - The full rendered message.
 */
function parseNestedMessages(variable, language, messages = getMessages([language])) {
	const matched = matchBrackets(NESTED_WRAPPER[0], NESTED_WRAPPER[1], variable);

	if (!matched) return variable;

	return (
		matched.pre +
		// eslint-disable-next-line no-use-before-define -- `renderMessage` and `parseNestedMessages` call each other.
		renderMessage(matched.body, language, messages) +
		parseNestedMessages(matched.post, language, messages)
	);
}

/**
 * Tagged template litteral function to escape a dynamic regular expression value.
 *
 * @param {TemplateStringsArray} hardcoded - Hardcoded values to keep as is.
 * @param {...string} unescaped - Strings to escape before adding back in.
 *
 * @returns {string} - The escaped string.
 */
function regexpEscape(hardcoded, ...unescaped) {
	return unescaped.reduce(
		(accumulated, value, index) =>
			`${accumulated}${value.replace(
				/[!$()*+./:=?[\\\]^{|}]/g,
				(character) => `\\${character}`,
			)}${hardcoded[index + 1]}`,
		hardcoded[0],
	);
}

/**
 * Renders a string with a language code and optional variables into a trnaslated message.
 *
 * @param {string} original - String to parse.
 * @param {string} language - Language to format plurals with.
 * @param {{ [key: string]: undefined | string }} [messages] - Messages to translate to.
 *
 * @returns {string} - Rendered message.
 */
function renderMessage(original, language, messages = getMessages([language])) {
	const formatter = getFormatter(language);

	return splitOnNotBetween(original, SEPERATORS.message, NESTED_WRAPPER[0], NESTED_WRAPPER[1])
		.map((splitmessage) => {
			const [messageCode, ...placeholders] = splitmessage
				// Trim excess whitespace
				.trim()

				// Condense remaining whitespce
				.replace(/\s/gu, " ")

				// Split the string into the message code and variables
				.split(
					new RegExp(
						regexpEscape`(?<![^\\\\]${NESTED_WRAPPER[0]}[^${NESTED_WRAPPER[1]}]+)(?<!\\\\)${SEPERATORS.placeholder}`,
						"u",
					),
				)

				// Handle embedded messages
				.map((variable) => parseNestedMessages(variable, language, messages))

				// Unescape escaped characters
				.map((parameter) =>
					parameter
						.replace(
							new RegExp(regexpEscape`\\${SEPERATORS.placeholder}`, "gu"),
							SEPERATORS.placeholder,
						)
						.replace(
							new RegExp(regexpEscape`\\\\${NESTED_WRAPPER[0]}`, "gu"),
							NESTED_WRAPPER[0],
						),
				);

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
 * @param {{ [key: string]: undefined | string }} [messages] - Messages to be used.
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
				? `${request.query.language || "*"}`.split(SEPERATORS.language).concat(
						// Fallback to values in cookie
						(request.cookies.languages || "*").split(SEPERATORS.language),

						// Fallback to browser language
						accepts(request).languages(),
				  )
				: request.cookies?.languages
				? (request.cookies.languages || "*").split(SEPERATORS.language)
				: accepts(request).languages(),
		);

	expires.setFullYear(expires.getFullYear() + 1);

	response.cookie("languages", languages.join(SEPERATORS.language), {
		expires,
		httpOnly: false,
		maxAge: 31536000000,
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		secure: process.env.NODE_ENV === "production",
		signed: false,
	});

	const messages = getMessages(languages);

	console.log(messages);

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
				language: MESSAGES[`${language}`]?.["footer.localization.thisLanguage"],
			}))
			.filter((language) => language.language);

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
