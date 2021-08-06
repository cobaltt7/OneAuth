"use strict";

/** @file ESLint Configuration file. */

module.exports = {
	extends: ["plugin:@onedotprojects/recommended"],

	overrides: [
		{
			extends: ["plugin:@onedotprojects/node"],
			files: ["**.js", "**.cjs"],
			parserOptions: { ecmaVersion: 12 },
		},
		{
			extends: ["plugin:@onedotprojects/esm"],
			files: ["**.js"],
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
