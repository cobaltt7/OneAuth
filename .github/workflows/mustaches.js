/** @file Formats {{mustache}} tags. */

"use strict";

const path = require("path"),
	replace = require("replace-in-file");

/**
 * Processes the output of `replace-in-file`.
 *
 * @param {{ hasChanged: boolean; file: string }[]} results - Results from `replace-in-file`.
 * @param {boolean} [log] - Whether to log output to the console.
 *
 * @returns {string | string[]} - Processed results.
 */
function processResult(results, log = true) {
	/** @type {string | string[]} */
	let filteredResults = results
		.filter((result) => result.hasChanged)
		.map((result) => result.file);
	filteredResults =
		filteredResults.length === 1
			? filteredResults[0] ?? []
			: filteredResults;
	if (log) {
		console.log(
			filteredResults.length === 0
				? "Updated no files"
				: (typeof filteredResults === "string"
						? "Updated file "
						: "Updated files: ") + [filteredResults].join("\n"),
		);
	}
	return filteredResults;
}

const commentRegex =
		/(?<!(?:\/\/|\/\*|#|<!--)(?:.+\s+)?\s*?mustache-format-ignore\s*?(?:\s+.+)?(?:\*\/|-->)?.+\n+)/,
	options = {
		cwd: `${path.resolve(__dirname, "../../")}/`,
		files: "**",
		glob: {
			cwd: `${path.resolve(__dirname, "../../")}/`,
			dot: true,
			follow: true,
			ignore: [
				"node_modules/**",
				".git/**",
				".github/workflows/mustaches.js",
			],
			nocase: true,
			nodir: true,
			strict: true,
		},
		ignore: [
			"node_modules/**",
			".git/**",
			".github/workflows/mustaches.js",
		],
	};

console.log("Replacing triple mustaches with double and a ampersand");
processResult(
	replace.sync({
		from: new RegExp(
			commentRegex.source + /{{{\s*(?<tagName>[^!#&/>^]+?)\s*}}}/.source,
			"g",
		),
		// eslint-disable-next-line id-length
		to: "{{ & $<tagName> }}",
		...options,
	}),
);

const result1 = processResult(
	replace.sync({
		from: new RegExp(
			commentRegex.source +
				/(?<tag>{{{\s*.+?\s*}}}|{{\s*&\s*.+?\s*}})/.source,
			"g",
		),
		// eslint-disable-next-line id-length
		to: "$<tag> ",
		...options,
	}),
	false,
);

if (result1.length) {
	console.warn(
		"Tripple mustaches are a potential security risk. Make sure you meant to use them!",
		"\n",
		"You used them in:",
		[result1].flat().join("\n"),
	);
}

console.log(
	"\nFormatting list mustaches, comment mustaches, and normal mustaches",
);
processResult(
	replace.sync({
		from: new RegExp(
			commentRegex.source +
				/{{\s*(?<typeIdentifier>[!#/^])?\s*(?<tagName>[^&>]+?)\s*}}/
					.source,
			"g",
		),
		// eslint-disable-next-line id-length
		to: "{{ $<typeIdentifier>$<tagName> }}",
		...options,
	}),
);

console.log("\nFormatting partial and unescaped mustaches");
processResult(
	replace.sync({
		from: new RegExp(
			commentRegex.source +
				/{{\s*(?<typeIdentifier>[&>])\s*(?<tagName>[^!#/^]+?)\s*}}/
					.source,
			"g",
		),
		// eslint-disable-next-line id-length
		to: "{{$<typeIdentifier> $<tagName> }}",
		...options,
	}),
);
