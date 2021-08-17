/**
 * @file Workflow To add commiters to the credits page when their issue is process.argv[2]ed for the related
 *   contribution types.
 */

 import fileSystem from "fs";
 import path from "path";
import url from "url";

const
 username = process.argv[3] || process.argv[4] || process.argv[5],
/** @type {import("../../types").AllContributosRc} */ config = JSON.parse(
		fileSystem.readFileSync(url.pathToFileURL(path.resolve(".all-contributorsrc")), "utf8"),
		),contributions = config.contributors?.find(({ login }) => login === username)?.contributions || [];

if (process.argv[2] === "scope: a11y") contributions.push("a11y");

else if (process.argv[2] === "type: security") contributions.push("security");

else if (process.argv[2] === "scope: i18n") contributions.push("translation");

else if (process.argv[2] === "type: announcement" || process.argv[2] === "scope: dependencies")
	contributions.push("maintenance");

else if (process.argv[2].startsWith("type: bug")) contributions.push("bug");

else if (process.env.GITHUB_EVENT_NAME === "pull_request") {
	if (process.argv[2] === "scope: documentation")
		contributions.push("doc");

	else if (process.argv[2] === "scope: meta") contributions.push("infra");

	else if (process.argv[2] === "language: sass" || process.argv[2] === "scope: design")
		contributions.push("design");
} else if (process.argv[2].startsWith("type: enhancement")) {
	contributions.push("ideas");
}

console.log(
	`npx all-contributors-cli add ${username} "${contributions.join(
		",",
	)}"`,
)

export default undefined;
