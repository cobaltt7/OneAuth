/** @file Formats {{mustache}} tags. */

import path from "node:path";
import replace from "replace-in-file";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));

/**
 * Processes the output of `replace-in-file`.
 *
 * @param {{ hasChanged: boolean; file: string }[]} results - Results from `replace-in-file`.
 *
 * @returns {string | string[]} - Processed results.
 */
function processResult(results) {
	/** @type {string | string[]} */
	let filteredResults = results
		.filter((result) => result.hasChanged)
		.map((result) => result.file);

	if (filteredResults.length === 1) filteredResults = filteredResults[0] ?? [];

	return filteredResults;
}

const commentRegex =
		/(?<!(?:\/\/|\/\*|#|<!--|{[^\S\n]{[^\S\n]!)?(?:.+[^\S\n]+)?[^\S\n]*mustache-format-ignore[^\S\n]*(?:(?:[^\S\n]*[\r\u2028\u2029]|[\t\v\f \xa0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]).+)?(?:\*\/|-->|}[^\S\n]})?.+\n+)/
			.source,
	options = {
		cwd: `${path.resolve(directory, "../../")}/`,
		files: "**",

		glob: {
			cwd: `${path.resolve(directory, "../../")}/`,
			dot: true,
			follow: true,

			ignore: ["node_modules/**", ".git/**", ".github/workflows/mustaches.js"],

			nocase: true,
			nodir: true,
			strict: true,
		},

		ignore: ["node_modules/**", ".git/**", ".github/workflows/mustaches.js"],
	};

console.log("Replacing triple mustaches with double and an ampersand...");
processResult(
	replace.sync({
		from: new RegExp(
			commentRegex +
				/(?:{[^\S\n]){2}{[^\S\n]*(?<tag>[^!#&/>^]*)[^\S\n]*(?:}[^\S\n]){2}}/.source,
			"g",
		),

		// eslint-disable-next-line id-length -- We didn't name this.
		to: "{{ & $<tag> }}",

		...options,
	}),
);

const tripple = processResult(
	replace.sync({
		from: new RegExp(
			commentRegex + /{[^\S\n]{[^\S\n]*(?:[!#/^][^\S\n]*)?[^&>]*p}[^\S\n]}/.source,
			"g",
		),

		// eslint-disable-next-line id-length -- We didn't name this.
		to: "<full> ",

		...options,
	}),
);

if (tripple.length > 0) {
	console.warn(
		"Tripple mustaches are a potential security risk. Make sure you meant to use them!",
		"\n",
		"You used them in:",
		[tripple].flat().join("\n"),
	);
}

console.log("\nFormatting list mustaches, comment mustaches, and normal mustaches");
processResult(
	replace.sync({
		from: new RegExp(
			commentRegex +
				/{[^\S\n]{[^\S\n]*(?:(?<type>[!#/^])[^\S\n]*)?(?<tag>[^&>]*)[^\S\n]*}[^\S\n]}/
					.source,
			"g",
		),

		// eslint-disable-next-line id-length -- We didn't name this.
		to: "{{ $<type>$<tag> }}",

		...options,
	}),
);

console.log("\nFormatting partial and unescaped mustaches");
processResult(
	replace.sync({
		from: new RegExp(
			commentRegex +
				/{[^\S\n]{[^\S\n]*(?<type>[&>])[^\S\n]*(?<tag>[^!#/^]*)[^\S\n]*}[^\S\n]}/.source,
			"g",
		),

		// eslint-disable-next-line id-length -- We didn't name this.
		to: "{{$<type> $<tag> }}",

		...options,
	}),
);
