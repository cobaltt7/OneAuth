/** @file Format And post data retrieved from Lighthouse. */

import fetch from "node-fetch";

/**
 * Join two arrays. (Just so syntax highlighting & prettier formatting work).
 *
 * @param {TemplateStringsArray} query - Array of default joiner values.
 * @param {...string} placeholderValues - Array of placeholder values.
 *
 * @returns {string} - The joined arrays.
 */
function graphql(query, ...placeholderValues) {
	return (
		// eslint-disable-next-line unicorn/no-array-reduce -- reduce is the best way to do this.
		placeholderValues.reduce(
			(last, placeholder, index) => `${last}${placeholder}${query[index + 1]}`,
			query[0],
		) || ""
	);
}

/**
 * Comment on the Lighthouse issue.
 *
 * @param {string} body - Body of the comment.
 *
 * @returns {Promise<any>} - Result from GitHub's GraphQL API.
 */
function commentOnDiscussion(body) {
	return fetch("https://api.github.com/graphql", {
		body: JSON.stringify({
			// Hmmst… query strings break prettier formatting...mustache? maybe
			query: graphql`mutation {
					addDiscussionComment(
						input: {discussionId: "MDEwOkRpc2N1c3Npb24zNDEwNDA2", body: "${body}"}
					) {
					  comment {
						id
					  }
					}
				  }`,
		}),

		headers: {
			"Authorization": `Bearer ${process.argv[2]}`,
			"GraphQL-Features": "discussions_api",
		},

		method: "POST",
	}).then((response) => response.json());
}

/** @type {import("../../types").lighthouseResult} */
let data;

try {
	if (process.argv[4]) throw new Error(process.argv[4]);

	data = JSON.parse(`${process.argv[3]}`);

	if (data.code !== "SUCCESS") throw new Error(`code: ${data.code}`);
} catch (error) {
	commentOnDiscussion(
		`An error occured while retrieving the data from Lighthouse.\n\`\`\`js\n${error}\n\`\`\``,
	);

	throw new Error(error);
}

try {
	let output =
		"# This week’s Lighthouse scores\n" +
		"| URL | Device | Accessibility | Best Practices | Performace " +
		"| Progressive Web App | SEO | PageSpeed Insights |\n" +
		"| - | - | - | - | - | - | - | - |\n";

	for (const result of data.data) {
		output +=
			`| ${result.url} | ${result.emulatedFormFactor} | ${Object.values(result.scores)
				.map((number) => `${number < 50 ? "🔴" : number < 90 ? "🟡" : "🟢"} ${number}`)
				.join(
					" | ",
				)} | [More information](https://developers.google.com/speed/pagespeed/insights/` +
			`?url=${encodeURIComponent(result.url)}&tab=${result.emulatedFormFactor}) |\n`;
	}

	commentOnDiscussion(output);
} catch (error) {
	commentOnDiscussion(
		"An error occured while generating the comment.\n" +
			`\`\`\`js\n${JSON.stringify(error)}\n\`\`\``,
	);

	throw error;
}
