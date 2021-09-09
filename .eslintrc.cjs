"use strict";

/** @file ESLint Configuration file. */

module.exports = {
	extends: ["plugin:@onedotprojects/recommended"],

	globals: {
		fetch: "readonly",
	},

	ignorePatterns: ["*.ts", "**.ts"],

	overrides: [
		{
			extends: ["plugin:@onedotprojects/node"],
			files: ["*.js", "*.cjs", "**.js", "**.cjs"],
			parserOptions: { ecmaVersion: 12 },

			rules: {
				"node/no-unsupported-features/es-syntax": 0,
			},
		},
		{
			extends: ["plugin:@onedotprojects/esm"],
			files: ["**.js", "*.js", "**.mjs", "*.mjs"],
		},
		{
			extends: ["plugin:@onedotprojects/cli"],

			files: [".github/workflows/*.js"],

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
	],
};
