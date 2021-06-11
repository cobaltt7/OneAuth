"use strict";
var path = require("path");
var replace = require("replace-in-file");

function processResult(results, log = true) {
	let filteredResults = results
		.filter((result) => result.hasChanged)
		.map((result) => result.file);
	filteredResults =
		filteredResults.length == 1 ? filteredResults[0] : filteredResults;
	if (log) {
		console.log(
			filteredResults.length == 0
				? "Updated no files"
				: (typeof filteredResults == "string"
						? "Updated file "
						: "Updated files: ") + [filteredResults].join("\n"),
		);
	}
	return filteredResults;
}

async function run() {
	const options = {
		files: "**",
		ignore: [
			"node_modules/**",
			".git/**",
			".github/workflows/mustaches.js",
		],
		glob: {
			cwd: path.resolve(__dirname, "../../") + "/",
			dot: true,
			strict: true,
			nocase: true,
			nodir: true,
			ignore: [
				"node_modules/**",
				".git/**",
				".github/workflows/mustaches.js",
			],
			follow: true,
		},
		cwd: path.resolve(__dirname, "../../") + "/",
	};

	const commentRegex =
		/(?<!(?:\/\/|\/\*|#|<!--)(?:.+\s+)?\s*?mustache-format-ignore\s*?(?:\s+.+)?(?:|\*\/|-->).+\n+)/;

	console.log("Replacing triple mustaches with double and a ampersand");
	processResult(
		replace.sync({
			from: new RegExp(
				commentRegex.source + /{{{\s*([^#^!/&>]+?)\s*}}}/.source,
				"g",
			),
			to: "{{ & $1 }}",
			...options,
		}),
	);

	const result1 = processResult(
		replace.sync({
			from: new RegExp(
				commentRegex.source +
					/({{{\s*([^]+?)\s*}}}|{{\s*&\s*([^]+?)\s*}})/.source,
				"g",
			),
			to: "$1 ",
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
		"\n" +
			"Formatting list mustaches, comment mustaches, and normal mustaches",
	);
	processResult(
		replace.sync({
			from: new RegExp(
				commentRegex.source + /{{\s*([#!^/])?\s*([^&>]+?)\s*}}/.source,
				"g",
			),
			to: "{{ $1$2 }}",
			...options,
		}),
	);

	console.log("\n" + "Formatting partial and unescaped mustaches");
	processResult(
		replace.sync({
			from: new RegExp(
				commentRegex.source + /{{\s*([&>])\s*([^#!^/]+?)\s*}}/.source,
				"g",
			),
			to: "{{$1 $2 }}",
			...options,
		}),
	);
}

run();
