"use strict";

/** @file ESLint Configuration file. */

module.exports = {
	extends: ["plugin:@onedotprojects/recommended"],

	overrides: [
		{
			extends: ["plugin:@onedotprojects/node"],
			files: ["**.js", "**.cjs"],
			parserOptions: { ecmaVersion: 11 },
		},
		{
			extends: ["plugin:@onedotprojects/esm"],
			files: ["**.js"],
		},
		{
			extends: ["plugin:@onedotprojects/cli"],
			files: [".github/**"],

			rules: {
				"import/no-extraneous-dependencies": [
					2,
					{
						bundledDependencies: false,
						devDependencies: true,
						optionalDependencies: false,
						peerDependencies: false,
					},
				],
			},
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
