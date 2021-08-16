/** @file Formats {{mustache}} tags. */

import path from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line node/no-unpublished-import -- It is published?
import replace from "replace-in-file";

const commentRegex =
		/(?<!(?:\/\/|\/\*|#|<!--|{[^\S\n]{[^\S\n]!)?(?:.+[^\S\n]+)?[^\S\n]*?mustache-format-ignore[^\S\n]*.*(?:\*\/|-->|}[^\S\n]})?.*\n+)/
			.source,
	ignore = ["node_modules/**", ".git/**", ".github/workflows/mustaches.js"],
	repoRoot = `${path.resolve(fileURLToPath(import.meta.url), "../../../")}\\`;

// eslint-disable-next-line one-var -- `options` depends on `ignore` and `repoRoot`.
const options = {
	cwd: repoRoot,
	files: "**",

	glob: {
		cwd: repoRoot,
		dot: true,
		follow: true,

		ignore,

		nocase: true,
		nodir: true,
		strict: true,
	},

	ignore,
};

console.log("Replacing triple mustaches with double and an ampersand...");

replace.sync({
	from: new RegExp(
		commentRegex + /(?:{[^\S\n]*){3}(?<tag>[^!#&/>^].+?)(?:[^\S\n]*}){3}/.source,
		"g",
	),

	// eslint-disable-next-line id-length -- We didn't name this.
	to: "{{ & $<tag> }}",

	...options,
});

const tripple = replace
	.sync({
		dry: true,

		from: new RegExp(
			commentRegex + /(?:{[^\S\n]*){2}(?:&.+?|{[^\S\n]*.+?[^\S\n]*})(?:[^\S\n]*}){2}/.source,
			"g",
		),

		// eslint-disable-next-line id-length -- We didn't name this.
		to: "$0 ",

		...options,
	})
	.filter((result) => result.hasChanged)
	.map((result) => result.file);

if (tripple.length > 0) {
	console.warn(
		"Tripple mustaches are a potential security risk. Make sure you meant to use them!",
		"\n",
		"You used them in:",
		[tripple].flat().join("\n"),
	);
}

console.log("\nFormatting list mustaches, comment mustaches, and normal mustaches");

replace.sync({
	from: new RegExp(
		commentRegex +
			/(?:{[^\S\n]*){2}(?<type>[!#/^]?)[^\S\n]*(?<tag>[^&>]+?)(?:[^\S\n]*}){2}/.source,
		"g",
	),

	// eslint-disable-next-line id-length -- We didn't name this.
	to: "{{ $<type>$<tag> }}",

	...options,
});

console.log("\nFormatting partial and unescaped mustaches");

replace.sync({
	from: new RegExp(
		commentRegex +
			/(?:{[^\S\n]*){2}(?<type>[&>])[^\S\n]*(?<tag>[^!#/^]+?)(?:[^\S\n]*}){2}/.source,
		"g",
	),

	// eslint-disable-next-line id-length -- We didn't name this.
	to: "{{$<type> $<tag> }}",

	...options,
});
