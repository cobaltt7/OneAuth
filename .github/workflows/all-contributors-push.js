/** @file Workflow To add commiters to the credits page on push for the related contribution types. */

import fileSystem from "fs";
import path from "path";
import url from "url";

// eslint-disable-next-line import/no-unassigned-import -- whatwg-fetch adds to global object
import "whatwg-fetch"

/** @type {import("../../types").AllContributosRc} */
const { contributors = [] } = JSON.parse(
		fileSystem.readFileSync(url.pathToFileURL(path.resolve(".all-contributorsrc")), "utf8"),
	),
	/** @type {{ [key: string]: string[] }} */
	NEW_CONTRIBUTORS = {},
	/** @type {Promise<import("../../types").Commit>[]} */
	commitPromises = process.argv[3].split(/\s+/g).map((hash) =>
		fetch(`https://api.github.com/repos/onedotprojects/auth/commits/${hash}`, {
			headers: {
				Authorization: `token ${process.argv[2]}`,
			},
		}).then((result) => result.json()),
	);

for (const commit of await Promise.all(commitPromises)) {
	if (!commit.commit) continue;

	const authors = commit.author?.login ? [commit.author.login] : [],
		matchUsername =
			/^(?:co-authored|signed-off)-by: (?<username>[\da-z](?:[\da-z]|-(?=[\da-z])){0,38}) </gimu;

	let username;

	// eslint-disable-next-line no-cond-assign -- We are aware and we want to do this.
	while (({ username } = matchUsername.exec(commit.commit.message)?.groups || {}))
		authors.push(username);

	const contributions = commit.files?.flatMap(({ filename }) => {
		const values = [];

		if (filename.startsWith("src/docs/")) values.push("doc");

		if (filename.startsWith(".github/")) values.push("infra");

		if (filename.startsWith("lib/") || filename.startsWith("src/")) values.push("code");

		if (
			(filename.startsWith("_locales/") && filename !== "_/locales/en_US.json") ||
			filename.startsWith(".tx/") ||
			filename === "lib/localization.js" ||
			filename === "src/l10n.js"
		)
			values.push("translation");

		if (filename === "src/tailwind.sass") values.push("design");

		if (filename === "_locales/en_US.json") values.push("content");

		return values;
	});

	for (const author of authors) {
		if (!NEW_CONTRIBUTORS[`${author}`]) {
			NEW_CONTRIBUTORS[`${author}`] =
				contributors.find(({ login }) => login === author)?.contributions || [];
		}

		NEW_CONTRIBUTORS[`${author}`] = [...NEW_CONTRIBUTORS[`${author}`], ...contributions].filter(
			(item, index, codes) => item && codes.indexOf(item) === index,
		);
	}
}

for (const username in NEW_CONTRIBUTORS) {
	if (
		Object.hasOwnProperty.call(NEW_CONTRIBUTORS, username) &&
		NEW_CONTRIBUTORS[`${username}`].length > 0
	) {
		console.log(
			`npx all-contributors-cli add ${username} "${NEW_CONTRIBUTORS[`${username}`].join(
				",",
			)}"`,
		);
	}
}
