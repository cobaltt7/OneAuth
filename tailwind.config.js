"use strict";

module.exports = {
	darkMode: "class",
	mode: "jit",
	plugins: [
		require("@tailwindcss/forms"),
		require("@tailwindcss/typography"),
	],
	purge: [
		"./auth/**.html",
		"./auth/html/**.html",
		"./routes/main/**.html",
		"./routes/main/partials/**.html",
		"./tailwind.css",
	],
	theme: {
		extend: {
			colors: {
				inherit: "inherit",
			},
		},
	},
};
