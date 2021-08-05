"use strict";

/** @file Tailwind Configuration file. */

/** @see {@link https://tailwindcss.com/docs/customizing-colors#color-palette-reference} For available colors. */
const colors = require("tailwindcss/colors"),
	columns = require("@markusantonwolf/tailwind-css-plugin-multi-columns"),
	forms = require("@tailwindcss/forms"),
	typography = require("@tailwindcss/typography");

module.exports = {
	darkMode: "class",
	mode: "jit",

	plugins: [columns, forms, typography],

	purge: ["./src/**/**.html", "./src/**/**/**.html", "./src/tailwind.sass"],

	theme: {
		colors: {
			...colors,
			current: "currentColor",
			transparent: "transparent",
		},

		screens: {
			"2xl": { max: "1535px" },
			"2xs": { max: "320px" },
			"landscape": { raw: "(orientation: landscape)" },
			"lg": { max: "1023px" },
			"md": { max: "767px" },
			"portrait": { raw: "(orientation: portrait)" },
			"print": { raw: "print" },
			"sm": { max: "600px" },
			"xl": { max: "1279px" },
			"xs": { max: "475px" },
		},
	},
};
