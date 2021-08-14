"use strict";

/** @file ESLint Configuration file. */

module.exports = {
	extends: ["plugin:@onedotprojects/recommended"],

	ignorePatterns: ["*.ts", "**.ts"],

	overrides: [
		{
			extends: ["plugin:@onedotprojects/node"],
			files: ["*.js", "*.cjs", "**.js", "**.cjs"],
			parserOptions: { ecmaVersion: 12 },
		},
		{
			extends: ["plugin:@onedotprojects/esm"],
			files: ["**.js", "*.js"],
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
