"use strict";

/** @file Tailwind Configuration file. */

const forms = require("@tailwindcss/forms"),
	typography = require("@tailwindcss/typography");

module.exports = {
	darkMode: "class",
	mode: "jit",

	plugins: [forms, typography],

	purge: ["./src/**/**.html", "./src/**/**/**.html", "./src/tailwind.sass"],

	theme: {
		extend: {
			colors: {
				inherit: "inherit",
			},
		},
	},
};
