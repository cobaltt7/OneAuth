"use strict";

function ignore(text) {
	return text;
}

const BASE_LANG = "en_US",
	LANG_CODES = [],
	MESSAGES = {};

const accepts = require("accepts"),
	fileSystem = require("fs"),
	globby = require("globby");

(async function () {
	const codes = await globby("_locales/*.json");
	codes.forEach((filename) => {
		const [, code] = filename.split(".")[0].split("/");
		MESSAGES[`${code}`] = JSON.parse(fileSystem.readFileSync(filename));
		LANG_CODES.push(code);
	});
})();

function compileLangs(langs) {
	const prefLangs = [
		...new Set(
			langs
				// Remove asterisks
				.filter((item) => item !== "*")
				.flatMap((language) => {
					// Standardize character between language and country code
					const standardLang = language.replaceAll("-", "_");
					ignore("prettier stop combining these variables");
					// Add language without country code as fallback
					const [noCountryLang] = standardLang.split("_");
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
	return prefLangs;
}

module.exports = {
	compileLangs,
	setLangFromRequest(req, res, next) {
		const LANGS = compileLangs([
			(req.query.lang ?? "*", // `lang` query parameter overrides everything else
			...accepts(req).languages()
		]),
			expires = new Date();
		console.log(LANGS)
		expires.setFullYear(expires.getFullYear() + 1);
		res.cookie("LANGS", LANGS.join("|"), {
			expires,
			maxAge: 31536000000,
			sameSite: false
		});

		next();
	},
};
