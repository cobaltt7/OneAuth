"use strict";

module.exports = {
	darkMode: "class",
	mode: "jit",
	plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
	purge: [
		"./src/auth/**.html",
		"./src/auth/html/**.html",
		"./src/routes/main/**.html",
		"./src/routes/main/partials/**.html",
		"./src/tailwind.css",
	],
	theme: {
		extend: {
			colors: {
				inherit: "inherit",
			},
		},
	},
};
