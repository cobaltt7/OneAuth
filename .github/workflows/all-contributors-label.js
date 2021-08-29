/**
 * @file Workflow To add commiters to the credits page when their issue is labeled for the related
 *   contribution types.
 */

import fileSystem from "fs";
import path from "path";
import url from "url";

import dotenv from "dotenv";

dotenv.config();

const username = process.argv[3] || process.argv[4] || process.argv[5];
/** @type {import("../../types").AllContributosRc} */
// eslint-disable-next-line one-var -- `contributions` depends on `username`.
const config = JSON.parse(
		fileSystem.readFileSync(url.pathToFileURL(path.resolve(".all-contributorsrc")), "utf8"),
	),
	contributions =
		config.contributors?.find(({ login }) => login === username)?.contributions || [];

switch (process.argv[2]) {
	case "scope: a11y": {
		contributions.push("a11y");

		break;
	}

	case "type: security": {
		contributions.push("security");

		break;
	}

	case "scope: i18n": {
		contributions.push("translation");

		break;
	}

	case "type: announcement":
	case "scope: dependencies": {
		contributions.push("maintenance");
	}
}

if (process.argv[2].startsWith("type: bug")) {
	contributions.push("bug");
} else if (process.env.GITHUB_EVENT_NAME === "pull_request") {
	switch (process.argv[2]) {
		case "scope: documentation": {
			contributions.push("doc");

			break;
		}

		case "scope: meta": {
			contributions.push("infra");

			break;
		}

		case "language: sass":
		case "scope: design": {
			contributions.push("design");

			break;
		}
	}
} else if (process.argv[2].startsWith("type: enhancement")) {
	contributions.push("ideas");
}

console.log(`npx all-contributors-cli add ${username} "${contributions.join(",")}"`);

export default undefined;
