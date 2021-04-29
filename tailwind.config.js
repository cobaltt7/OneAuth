"use strict";

module.exports = {
	theme: {
		extend: {
			colors: {
				inherit: "inherit",
			},
		},
	},
	purge: [
		"./views/**.html",
		"./auth/html/**.html",
		"./routes/main/**.html",
		"./routes/main/partials/**.html",
		"./tailwind.css",
	],
	darkMode: "class",
	plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
	mode: "jit",
};
