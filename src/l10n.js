/** @file Localization Of the site. */

/** @type {{ [key: string]: string[] }} */
const CACHE_CODES = {};

/** @type {{ [key: string]: MessageFormatter }} */
// eslint-disable-next-line one-var
const CACHE_FORMATTERS = {};

/** @type {{ [key: string]: { [key: string]: string } }} */
// eslint-disable-next-line one-var
const CACHE_MSGS = {};

/** @type {string[]} */
// eslint-disable-next-line one-var
const LANG_CODES = [];

/** @type {{ [key: string]: { [key: string]: string } }} */
// eslint-disable-next-line one-var
const MESSAGES = {};

const BASE_LANG = "en_US",
	accepts = require("accepts"),
	globby = require("globby"),
	{ logError } = require("./errors"),
	{
		MessageFormatter,
		pluralTypeHandler,
	} = require("@ultraq/icu-message-formatter");

(async function () {
	const codes = await globby("_locales/*.json");
	codes.forEach((filename) => {
		const [, code] = filename.split(".")[0]?.split("/") ?? [
			"_locales",
			"en_US",
		];
		MESSAGES[`${code}`] = {};
		/** @type {{ [key: string]: { [key: string]: string; string: string } }} */
		const tempMsgs = require(`../${filename}`);
		for (const item in tempMsgs) {
			if ({}.hasOwnProperty.call(tempMsgs, item)) {
				if (!tempMsgs[item]?.string) continue;

				// @ts-expect-error - TS thinks `MESSAGES[code]` and `tempMsgs[item]` might be `undefined`.
				// That's imposssible. See L38 and L43.
				MESSAGES[`${code}`][`${item}`] = `${tempMsgs[item].string}`;
			}
		}

		LANG_CODES.push(`${code}`);
	});
})();

/**
 * Expands array of languages to be broader.
 *
 * @param {string[]} langs - Input languages.
 * @param {boolean} [cache] - Whether languages should be loaded from the cache if possible.
 *
 * @returns {string[]} - Resulting array.
 */
function compileLangs(langs, cache = false) {
	if (cache) {
		const retrieved = CACHE_CODES[`${langs}`];
		if (retrieved) return retrieved;
	}

	/** @type {string[]} */
	// @ts-expect-error - TS thinks there might be `undefinded` values in the array.
	// That's inpossible, see L102.
	const prefLangs = [
		...new Set(
			langs

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
						...LANG_CODES.filter(
							(langCode) =>
								langCode.indexOf(`${noCountryLang}`) === 0,
						),
					];
				}),

			// Add base language as fallback to the fallback
		).add(BASE_LANG),

		// Remove duplicates by converting it to a `Set` then back to an `Array`
	]

		// Remove undefined values
		.filter((lang) => typeof lang === "string");

	// Slice it on the base language because the base langauge has everything that we'd need
	prefLangs.splice(prefLangs.indexOf(BASE_LANG) + 1);

	CACHE_CODES[`${langs}`] = prefLangs;
	return prefLangs;
}

/**
 * Get messages in the first avilable language.
 *
 * @param {string[]} langs - Languages to use when searching for messages.
 * @param {boolean} [cache] - Whether to load messages from the cache when possible.
 *
 * @returns {{ [key: string]: string }} - Retrieved messages.
 */
function getMsgs(langs, cache = true) {
	if (cache) {
		const retrieved = CACHE_MSGS[`${langs}`];
		if (retrieved) return retrieved;
	}

	/** @type {{ [key: string]: string }} */
	let msgs = {};
	langs.forEach((langCode) => {
		msgs = { ...MESSAGES[`${langCode}`], ...msgs };
	});
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
function getFormatter(lang, cache = true) {
	if (cache) {
		/** @type {MessageFormatter} */
		const retrieved = CACHE_FORMATTERS[`${lang}`];
		if (retrieved) return retrieved;
	}
	return (CACHE_FORMATTERS[`${lang}`] = new MessageFormatter(lang, {
		plural: pluralTypeHandler,
	}).format);
}

/**
 * Parses a string into a language code and optional placeholder data. Renders a translation with them.
 *
 * @param {string} inputInfo - String to parse, including a message code and optional placeholders.
 * @param {string} lang - Language code to be used when retreiving a plural formatter.
 * @param {{ [key: string]: string }} msgs - Messages to be used.
 *
 * @returns {string} - Rendered message.
 */
function parseMessage(inputInfo, lang, msgs) {
	const [msgCode, ...placeholders] = inputInfo

		// Trim excess whitespace
		.trim()

		// Condense remaining whitespce
		.replace(/\s/g, " ")

		// Split on `|||`
		.split(/(?<![^\\]\[[^\]]*)(?<!\\)\|{3}/)

		.map((param) =>
			param.startsWith("[") && param.endsWith("]")
				? parseMessage(param.slice(1, param.length - 1), lang, msgs)
				: param,
		)

		// Handle escaping the `|||` and `[` (prefixing them with a `\`)
		.map((param) => param.replace(/\\\|{3}/g, "|||").replace(/\\\[/g, "["));

	return getFormatter(lang)(
		// Get message, fallback to the code provided
		msgs[`${msgCode}`] ?? msgCode,

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
function mustacheFunc(langs, msgs = getMsgs(langs)) {
	return function () {
		return function (val, render) {
			return parseMessage(render(val), `${langs[0]}`, msgs);
		};
	};
}

module.exports = {
	compileLangs,
	getFormatter,
	getMsgs,
	/**
	 * Express l10n middleware.
	 *
	 * @param {e.Request} req - Express request object.
	 * @param {e.Response} res - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 */
	middleware(req, res, next) {
		/** @type {string[]} */
		let langs;
		if (req.query?.lang) {
			langs = compileLangs([
				// `lang` query parameter overrides everything else
				...(`${req.query?.lang}` ?? "*").split("|"),

				// Fallback to values in cookie
				...(req.cookies?.langs ?? "*").split("|"),

				// Fallback to browser lang
				...accepts(req).languages(),
			]);
		} else if (req.cookies?.langs) {
			// The cookie doesn't need to go through `compileLangs` since it already did
			langs = (req.cookies?.langs ?? "*").split("|");
		} else {
			// This is the default, the broswer langauge.
			langs = compileLangs(accepts(req)?.languages(), true);
		}
		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		res.cookie("langs", langs.join("|"), {
			expires,
			maxAge: 31536000000,
			sameSite: false,
		});
		req.languages = langs;
		const msgs = getMsgs(langs);
		req.messages = msgs;

		// Grab reference of render
		const { render } = res;

		/**
		 * Override res.render to ensure `msg` is always available.
		 *
		 * @param {string} view - The file to render.
		 * @param {{ [key: string]: any } | ((err: Error, str: string) => void)} [placeholderCallback]
		 *   - Data to render it with or callback to run after render.
		 *
		 * @param {(err: Error, str: string) => void} [callback] - Callback to run after render.
		 *
		 * @returns {void}
		 */
		res.render = function (
			view,
			placeholderCallback = {},
			callback = function (err, str) {
				if (err) return logError(err);

				return res.send(str);
			},
		) {
			const opts =
				typeof placeholderCallback === "object"
					? placeholderCallback
					: {};
			opts.message = mustacheFunc(langs, msgs);

			// Continue with original render
			return render.call(
				this,
				view,
				opts,
				// @ts-expect-error - TS doesn't like the first param, but it is needed.
				typeof placeholderCallback === "function"
					? placeholderCallback
					: callback,
			);
		};
		next();
	},
	mustacheFunc,
};
