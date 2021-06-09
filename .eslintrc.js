/** @file ESLint Configuration file. */

module.exports = {
	env: { browser: false, es2020: true, es6: true, node: true },
	extends: [
		"eslint:all",
		"plugin:node/recommended",
		"plugin:regexp/recommended",
		"plugin:markdown/recommended",
		"prettier",
	],
	ignorePatterns: ["node_modules", ".upm", "src/main/style.css"],
	overrides: [
		{
			files: ["**.md"],
			processor: "markdown/markdown",
		},
		{
			env: { browser: true, es2020: false, es6: true, node: true },
			files: ["**.md/*.js"],
			parserOptions: {
				ecmaFeatures: { impliedStrict: true },
				ecmaVersion: 8,
			},
			rules: {
				"eol-last": [2, "never"],
				"jsdoc/require-file-overview": 0,
				"no-console": 0,
				"no-undef": 0,
				"no-unused-expressions": 0,
				"no-unused-vars": 0,
			},
		},
		{
			env: { browser: true, es2020: true, es6: true, node: false },
			extends: ["plugin:compat/recommended"],
			files: ["**.html"],
			parserOptions: { ecmaVersion: 8 },
			rules: {
				"comma-dangle": 0,
				"jsdoc/require-file-overview": 0,
				"no-console": 2,
			},
		},
		{
			files: [
				"src/auth/*/index.js",
				"src/l10n.js",
				"src/*/index.js",
				"**.config.js",
				"**rc.js",
			],
			parserOptions: { sourceType: "module" },
		},
	],
	parserOptions: { ecmaVersion: 11, sourceType: "script" },
	plugins: [
		"compat",
		"html",
		"jsdoc",
		"markdown",
		"node",
		"optimize-regex",
		"regexp",
	],
	// eslint-disable-next-line id-length
	reportUnusedDisableDirectives: true,
	root: true,
	rules: {
		"array-element-newline": 0,
		"comma-dangle": [1, "always-multiline"],
		"curly": [1, "multi-or-nest", "consistent"],
		"dot-location": [1, "property"],
		"func-names": 0,
		"func-style": [1, "declaration", { allowArrowFunctions: true }],
		"function-call-argument-newline": [1, "consistent"],
		"function-paren-newline": 0,
		"id-length": [1, { exceptions: ["_"], max: 20, min: 3 }],
		"implicit-arrow-linebreak": 0,
		"indent": [1, "tab"],
		"indent-legacy": 0,
		"init-declarations": 0,
		"jsdoc/check-access": 1,
		"jsdoc/check-alignment": 1,
		"jsdoc/check-examples": 1,
		"jsdoc/check-line-alignment": 1,
		"jsdoc/check-param-names": 1,
		"jsdoc/check-property-names": 1,
		"jsdoc/check-syntax": 1,
		"jsdoc/check-tag-names": 1,
		"jsdoc/check-types": 1,
		"jsdoc/check-values": 1,
		"jsdoc/empty-tags": 1,
		"jsdoc/implements-on-classes": 1,
		"jsdoc/match-description": 1,
		"jsdoc/newline-after-description": 1,
		"jsdoc/no-bad-blocks": 1,
		"jsdoc/no-defaults": 1,
		"jsdoc/no-undefined-types": 0,
		"jsdoc/require-asterisk-prefix": 1,
		"jsdoc/require-description": 1,
		"jsdoc/require-description-complete-sentence": 1,
		"jsdoc/require-file-overview": 1,
		"jsdoc/require-hyphen-before-param-description": 1,
		"jsdoc/require-jsdoc": 1,
		"jsdoc/require-param": 1,
		"jsdoc/require-param-description": 1,
		"jsdoc/require-param-name": 1,
		"jsdoc/require-param-type": 1,
		"jsdoc/require-property": 1,
		"jsdoc/require-property-description": 1,
		"jsdoc/require-property-name": 1,
		"jsdoc/require-property-type": 1,
		"jsdoc/require-returns": 1,
		"jsdoc/require-returns-check": 1,
		"jsdoc/require-returns-description": 1,
		"jsdoc/require-returns-type": 1,
		"jsdoc/require-throws": 1,
		"jsdoc/require-yields": 1,
		"jsdoc/require-yields-check": 1,
		"linebreak-style": 0,
		"lines-around-comment": 0,
		"max-len": [1, { code: 100, ignoreRegExpLiterals: true, tabWidth: 2 }],
		"max-lines": [
			1,
			{ max: 500, skipBlankLines: true, skipComments: true },
		],
		"max-lines-per-function": [
			2,
			{ IIFEs: true, max: 100, skipBlankLines: true, skipComments: true },
		],
		"max-params": [1, { max: 5 }],
		"max-statements": 0,
		"multiline-comment-style": 0,
		"multiline-ternary": [1, "always-multiline"],
		"new-cap": [1, { capIsNew: true, newIsCap: true, properties: true }],
		"no-confusing-arrow": 0,
		"no-console": 1,
		"no-continue": 0,
		"no-extra-parens": 0,
		"no-magic-numbers": 0,
		"no-mixed-operators": 0,
		"no-nested-ternary": 0,
		"no-restricted-syntax": 2,
		"no-tabs": 0,
		"no-ternary": 0,
		"no-unused-vars": [
			1,
			{ args: "all", argsIgnorePattern: "_", caughtErrors: "all" },
		],
		"node/exports-style": 2,
		"node/file-extension-in-import": 2,
		"node/handle-callback-err": 2,
		"node/no-callback-literal": 2,
		"node/no-new-require": 2,
		"node/no-path-concat": 2,
		"node/no-process-exit": 2,
		"node/no-restricted-import": 2,
		"node/no-restricted-require": 2,
		"node/no-unpublished-require": 0,
		"node/prefer-promises/fs": 2,
		"object-curly-spacing": [1, "always"],
		"one-var": [1, "consecutive"],
		"optimize-regex/optimize-regex": 1,
		"padded-blocks": [1, "never"],
		"quote-props": [1, "consistent-as-needed"],
		"quotes": [1, "double", { avoidEscape: true }],
		"regexp/confusing-quantifier": 2,
		"regexp/control-character-escape": 2,
		"regexp/hexadecimal-escape": 2,
		"regexp/letter-case": 2,
		"regexp/negation": 2,
		"regexp/no-dupe-disjunctions": 2,
		"regexp/no-empty-alternative": 2,
		"regexp/no-lazy-ends": 2,
		"regexp/no-legacy-features": 2,
		"regexp/no-non-standard-flag": 2,
		"regexp/no-obscure-range": 2,
		"regexp/no-optional-assertion": 2,
		"regexp/no-potentially-useless-backreference": 2,
		"regexp/no-standalone-backslash": 2,
		"regexp/no-trivially-nested-assertion": 2,
		"regexp/no-trivially-nested-quantifier": 2,
		"regexp/no-useless-assertions": 2,
		"regexp/no-useless-character-class": 2,
		"regexp/no-useless-dollar-replacements": 2,
		"regexp/no-useless-escape": 2,
		"regexp/no-useless-flag": 2,
		"regexp/no-useless-lazy": 2,
		"regexp/no-useless-non-capturing-group": 2,
		"regexp/no-useless-non-greedy": 2,
		"regexp/no-useless-quantifier": 2,
		"regexp/no-useless-range": 2,
		"regexp/no-zero-quantifier": 2,
		"regexp/optimal-lookaround-quantifier": 2,
		"regexp/order-in-character-class": 2,
		"regexp/prefer-character-class": 2,
		"regexp/prefer-escape-replacement-dollar-char": 2,
		"regexp/prefer-named-backreference": 2,
		"regexp/prefer-predefined-assertion": 2,
		"regexp/prefer-quantifier": 2,
		"regexp/prefer-range": 2,
		"regexp/prefer-regexp-exec": 2,
		"regexp/prefer-regexp-test": 2,
		"regexp/prefer-unicode-codepoint-escapes": 2,
		"regexp/sort-flags": 2,
		"regexp/unicode-escape": 2,
		"require-unicode-regexp": 0,
		"space-before-function-paren": [
			1,
			{ anonymous: "always", asyncArrow: "always", named: "never" },
		],
		"strict": [2, "global"],
		"wrap-iife": [1, "inside"],
	},
	settings: { html: { "xml-extensions": [".svg"] } },
};
