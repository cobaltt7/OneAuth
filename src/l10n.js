"use strict";

let LANG = "en_US";

const accepts = require("accepts");

module.exports = {
	setLang(lang) {
		LANG = lang;
	},
	setLangFromRequest(req) {
		const a = accepts(req);
		console.log(a.charsets(), a.encodings(), a.languages());
	},
};
