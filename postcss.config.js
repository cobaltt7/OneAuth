"use strict";

module.exports = {
	map: false,
	parser: "postcss-scss",
	plugins: [
		require("postcss-advanced-variables"),
		require("postcss-map-get")(),
		require("postcss-import"),
		require("tailwindcss"),
		require("postcss-nested"),
		require("postcss-sort-media-queries")(),
		require("autoprefixer"),
	],
};
