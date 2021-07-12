/** @file Formats {{mustache}} tags. */

import path from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line node/no-unpublished-import -- It is published?
import replace from "replace-in-file";

const commentRegex =
		/(?<!(?:\/\/|\/\*|#|<!--|{[^\S\n]{[^\S\n]!)?(?:.+[^\S\n]+)?[^\S\n]*mustache-format-ignore[^\S\n]*(?:(?:[^\S\n]*[\r\u2028\u2029]|[\t\v\f \xa0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]).+)?(?:\*\/|-->|}[^\S\n]})?.+\n+)/
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
		commentRegex + /(?:{[^\S\n]){2}{[^\S\n]*(?<tag>[^!#&/>^]*)[^\S\n]*(?:}[^\S\n]){2}}/.source,
		"g",
	),

	// eslint-disable-next-line id-length -- We didn't name this.
	to: "{{ & $<tag> }}",

	...options,
});

const tripple = replace
	.sync({
		from: new RegExp(
			commentRegex + /{[^\S\n]{[^\S\n]*(?:[!#/^][^\S\n]*)?[^&>]*p}[^\S\n]}/.source,
			"g",
		),

		// eslint-disable-next-line id-length -- We didn't name this.
		to: "$0 hi",

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
			/{[^\S\n]{[^\S\n]*(?:(?<type>[!#/^])[^\S\n]*)?(?<tag>[^&>]*)[^\S\n]*}[^\S\n]}/.source,
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
			/{[^\S\n]{[^\S\n]*(?<type>[&>])[^\S\n]*(?<tag>[^!#/^]*)[^\S\n]*}[^\S\n]}/.source,
		"g",
	),

	// eslint-disable-next-line id-length -- We didn't name this.
	to: "{{$<type> $<tag> }}",

	...options,
});
