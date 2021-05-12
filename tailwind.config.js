"use strict";

module.exports = {
	darkMode: "class",
	mode: "jit",
	plugins: [
		require("@tailwindcss/forms"),
		require("@tailwindcss/typography"),
	],
	purge: [
		"./src/routes/**/**.html",
		"./src/routes/**/**/**.html",
		"./src/tailwind.sass",
	],
	theme: {
		extend: {
			colors: {
				inherit: "inherit",
			},
		},
	},
};
