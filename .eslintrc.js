"use strict";

/** @file ESLint Configuration file. */

module.exports = {
	extends: ["plugin:@onedotprojects/recommended"],

	overrides: [
		{
			extends: ["plugin:@onedotprojects/node"],
			files: ["**.js"],
			parserOptions: { ecmaVersion: 11 },
		},
		{
			extends: ["plugin:@onedotprojects/workflow"],
			files: [".github/**"],
		},
		{
			extends: ["plugin:@onedotprojects/config"],
			files: ["**.config.js", "**rc.js"],
		},
		{
			extends: ["plugin:@onedotprojects/sample"],
			files: ["**.md/**", "**.md"],
		},
		{
			extends: ["plugin:@onedotprojects/browser"],
			files: ["**.html", "**.htm"],
		},
	],
};
