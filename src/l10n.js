"use strict";

const BASE_LANG = "en_US",
	CACHE_CODES = {},
	CACHE_MSGS = {},
	LANG_CODES = [],
	MESSAGES = {};

const accepts = require("accepts"),
	fileSystem = require("fs"),
	globby = require("globby");

(async function () {
	const codes = await globby("_locales/*.json");
	codes.forEach((filename) => {
		const [, code] = filename.split(".")[0].split("/"),
			tempMsgs = JSON.parse(fileSystem.readFileSync(filename));
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
						...LANG_CODES.filter((langCode) => langCode.indexOf(noCountryLang) === 0),
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
		msgs = { ...MESSAGES[langCode],
			...msgs };
	});
	CACHE_MSGS[`${langs}`] = msgs;
	return msgs;
}
module.exports = {
	compileLangs,
	getMsgs,
	setLangFromRequest(req, res, next) {
		let langs;
		if (req.query.lang) {
			langs = compileLangs([
				// `lang` query parameter overrides everything else
				...(req.query.lang ?? "*").split("|"),
				// Fallback to values in cookie
				...(req.cookies.langs ?? "*").split("|"),
				// Fallback to browser lang
				...accepts(req).languages(),
			]);
		} else if (req.cookies.lang) {
			// The cookie doesn't need to go through `compileLangs` since it already did
			langs = (req.cookies.langs ?? "*").split("|");
		} else {
			// This is the default, the broswer langauge.
			langs = compileLangs(accepts(req).languages(), true);
		}
		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		res.cookie("langs", langs.join("|"), {
			expires,
			maxAge: 31536000000,
			sameSite: false,
		});
		req.languages = langs;
		// Grab reference of render
		const render = res.render;
		// Override logic
		res.render = function (view, options, callback) {
			if (typeof options === "object") {
				options.msgs = getMsgs(langs);
			}
			// Continue with original render
			render.call(this, view, options, callback);
		};
		next();
	},
};
