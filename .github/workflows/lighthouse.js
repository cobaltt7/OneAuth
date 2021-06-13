/** @file Format And post data retrieved from Lighthouse. */

"use strict";

const fetch = require("node-fetch");

/**
 * Comment on the Lighthouse issue.
 *
 * @param {string} body - Body of the comment.
 * @returns {Promise<any>} - Result from GitHub's GraphQL API.
 */
function commentOnDiscussion(body) {
	return fetch("https://api.github.com/graphql", {
			body: JSON.stringify({
				query: `mutation {
					addDiscussionComment(
						input: {discussionId: "MDEwOkRpc2N1c3Npb24zNDEwNDA2", body: "${body}"}
					) {
					  comment {
						id
					  }
					}
				  }`,
				variables: null
			}),
			headers: {
				"Authorization": `Bearer ${process.argv[2]}`,
				"GraphQL-Features": "discussions_api",
			},
			method: "POST",
		}).then((response) => response.json())
}

if (process.argv[4]) {
	commentOnDiscussion( "An error occured while retrieving the data from Lighthouse.");
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

	commentOnDiscussion( OUTPUT);
} catch (error) {
	commentOnDiscussion(
			"An error occured while generating the comment.\n" +
		`\`\`\`js\n${JSON.stringify(error)}\n\`\`\``);
	throw error
}
