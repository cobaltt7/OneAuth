"use strict";

const BASE_LANG = "en_US",
	CACHE_CODES = {},
	CACHE_FORMATTERS = {},
	CACHE_MSGS = {},
	LANG_CODES = [],
	MESSAGES = {},
	accepts = require("accepts"),
	globby = require("globby"),
	{
		MessageFormatter,
		pluralTypeHandler,
	} = require("@ultraq/icu-message-formatter");

(async function () {
	const codes = await globby("_locales/*.json");
	codes.forEach((filename) => {
		const [, code] = filename.split(".")[0].split("/"),
			tempMsgs = require(`../${filename}`);
		for (const item in tempMsgs) {
			if ({}.hasOwnProperty.call(tempMsgs, item)) {
				tempMsgs[item] = tempMsgs[item].string;
			}
		}
		MESSAGES[`${code}`] = tempMsgs;

		LANG_CODES.push(code);
	});
})();

function compileLangs(langs, cache = false) {
	if (cache) {
		const retrieved = CACHE_CODES[`${langs}`];
		if (retrieved) {
			return retrieved;
		}
	}
	const prefLangs = [
		...new Set(
			langs

				// Remove asterisks
				.filter((item) => item !== "*")
				.flatMap((language) => {
					// Standardize character between language and country code
					const standardLang = language.replaceAll("-", "_"),
						// Add language without country code as fallback
						[noCountryLang] = standardLang.split("_");
					return [
						standardLang,
						noCountryLang,

						// Add other countries with the same languages' country codes as fallbacks
						...LANG_CODES.filter(
							(langCode) => langCode.indexOf(noCountryLang) === 0,
						),
					];
				}),

			// Add base language as fallback to the fallback
		).add(BASE_LANG),

		// Remove duplicates by converting it to a `Set` then back to an `Array`
	];

	// Slice it on the base language because the base langauge has everything that we'd need
	prefLangs.splice(prefLangs.indexOf(BASE_LANG) + 1);

	CACHE_CODES[`${langs}`] = prefLangs;
	return prefLangs;
}

function getMsgs(langs, cache = true) {
	if (cache) {
		const retrieved = CACHE_MSGS[`${langs}`];
		if (retrieved) {
			return retrieved;
		}
	}
	let msgs = {};
	langs.forEach((langCode) => {
		msgs = { ...MESSAGES[langCode], ...msgs };
	});
	CACHE_MSGS[`${langs}`] = msgs;
	return msgs;
}

function getFormatter(lang, cache = true) {
	if (cache) {
		const retrieved = CACHE_FORMATTERS[`${lang}`];
		if (retrieved) {
			return retrieved;
		}
	}
	return (CACHE_FORMATTERS[`${lang}`] = new MessageFormatter(lang, {
		plural: pluralTypeHandler,
	}).format);
}

function parseMessage(inputInfo, langs, msgs) {
	const [msgCode, ...placeholders] = inputInfo

		.replace(/\s/g, " ")
		.trim()

		// Split on `|||`
		.split(/(?<![^\\]\[[^\]]*)(?<!\\)\|{3}/)

		.map((param) =>
			param.startsWith("[") && param.endsWith("]")
				? parseMessage(param.slice(1, param.length - 1), langs, msgs)
				: param,
		)

		// Handle escaping the `|||` and `[` (prefixing them with a `\`)
		.map((param) => param.replace(/\\\|{3}/g, "|||").replace(/\\\[/g, "["));

	return getFormatter(langs[0])(
		// Get message, fallback to the code provided
		msgs[msgCode] ?? msgCode,

		// Render it with placeholders
		placeholders,
	);
}

function mustacheFunc(langs, msgs = getMsgs(langs)) {
	return function () {
		return function (val, render) {
			return parseMessage(render(val), langs, msgs);
		};
	}
}

module.exports = {
	compileLangs,
	getFormatter,
	getMsgs,
	middleware(req, res, next) {
		let langs;
		if (req?.query?.lang) {
			langs = compileLangs([
				// `lang` query parameter overrides everything else
				...(req?.query?.lang ?? "*").split("|"),

				// Fallback to values in cookie
				...(req?.cookies?.langs ?? "*").split("|"),

				// Fallback to browser lang
				...accepts(req).languages(),
			]);
		} else if (req?.cookies?.langs) {
			// The cookie doesn't need to go through `compileLangs` since it already did
			langs = (req?.cookies?.langs ?? "*").split("|");
		} else {
			// This is the default, the broswer langauge.
			langs = compileLangs(accepts(req)?.languages(), true);
		}
		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		res?.cookie("langs", langs.join("|"), {
			expires,
			maxAge: 31536000000,
			sameSite: false,
		});
		req.languages = langs;
		const msgs = getMsgs(langs);
		req.msgs = msgs;

		// Grab reference of render
		const { render: realRender } = res;

		// Override logic
		res.render = function (view, options, callback) {
			if (typeof options === "object") {
				options.msgs = mustacheFunc(langs,msgs);
			}

			// Continue with original render
			realRender.call(this, view, options, callback);
		};
		next();
	},
	mustacheFunc,
};
