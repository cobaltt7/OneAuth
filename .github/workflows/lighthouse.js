/** @file Format And post data retrieved from Lighthouse. */

"use strict";

const github = require("@actions/github");
const octokit = github.getOctokit(process.argv[2]);

if (process.argv[4]) {
	octokit.issues.createComment({
		...github.context.repo,
		body: "An error occured while retrieving the data from Lighthouse.",
		// eslint-disable-next-line camelcase
		issue_number: "29",
	});
	throw new Error(
		"An error occured while retrieving the data from Lighthouse.",
	);
}

try {
	/** @type {import("../../types").lighthouseResult} */
	const { code, data } = JSON.parse(`${process.argv[3]}`);

	if (code !== "SUCCESS") throw new Error(code);

	let OUTPUT =
		"# This week's Lighthouse scores\n" +
		"| URL | Device | Accessibility | Best Practices | Performace " +
		"| Progressive Web App | SEO | PageSpeed Insights |\n" +
		"| - | - | - | - | - | - | - | - |\n";

	data.forEach((result) => {
		OUTPUT +=
			`| ${result.url} | ${result.emulatedFormFactor} | ${Object.values(
				result.scores,
			)
				.map(
					(num) =>
						`${num < 50 ? "🔴" : num < 90 ? "🟡" : "🟢"} ${num}`,
				)
				.join(
					" | ",
				)} | [More information](https://developers.google.com/speed/pagespeed/insights/` +
			`?url=${encodeURIComponent(result.url)}&tab=${
				result.emulatedFormFactor
			}) |\n`;
	});

	octokit.issues.createComment({
		...github.context.repo,
		body: OUTPUT,
		// eslint-disable-next-line camelcase
		issue_number: "29",
	});
} catch (error) {
	octokit.issues.createComment({
		...github.context.repo,
		body:
			"An error occured while generating the comment.\n" +
			`\`\`\`js\n${JSON.stringify(error)}\n\`\`\``,
		// eslint-disable-next-line camelcase
		issue_number: "29",
	});
}
