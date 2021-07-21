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
	const d= (
		// eslint-disable-next-line unicorn/no-array-reduce -- reduce is the best way to do this.
		placeholderValues.reduce(
			(last, placeholder, index) => `${last}${placeholder}${query[index + 1]}`,
			query[0],
		) || ""
	);
	console.log(d);
	return d
}

/**
 * Comment on the Lighthouse issue.
 *
 * @param {string} body - Body of the comment.
 *
 * @returns {Promise<unknown>} - Result from GitHub's GraphQL API.
 */
function commentOnDiscussion(body) {
	return fetch("https://api.github.com/graphql", {
		body: JSON.stringify({
			// Hmmst… query strings break prettier formatting...mustache? maybe
			query: graphql`mutation {
					addDiscussionComment(
						input: {discussionId: "MDEwOkRpc2N1c3Npb24zNDEwNDA2", body: ${JSON.stringify(body)}}
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
	}).then((response) => response.text()).then((response)=>{console.log({response});return JSON.stringify(response)});
}

/**
 * Transpose array.
 *
 * @param {unknown[][]} matrix
 */
function transpose(matrix) {
	return matrix[0].map((_, i) => matrix.map((row) => row[i]));
}

/**
 * Add emoji colored based on a number.
 *
 * @param {number} number
 */
function addEmoji(number) {
	return `${number < 50 ? "🔴" : number < 90 ? "🟡" : "🟢"} ${number}`;
}

/** @type {import("../../types").lighthouseResult} */
let data;

try {
	if (process.argv[4]) throw new Error(process.argv[4]);

	data = JSON.parse(`${process.argv[3]}`);

	if (data.code !== "SUCCESS") throw new Error(`code: ${data.code}`);
} catch (error) {
	commentOnDiscussion(
		`An error occurred while retrieving the data from Lighthouse.\n\`\`\`js\n${error}\n\`\`\``,
	);

	throw new Error(error);
}

try {
	const allScores = transpose(data.data.map(({scores: s}) => Object.values(s))).map(
		(s) => s.reduce((a, b) => a + b, 0) / s.length,
	);
	commentOnDiscussion(
		"<h2>Today’s Lighthouse scores</h2><br /> <br />" +
		"<table><thead><tr><th>URL</th>" +
		"<th>Device</th>" +
		"<th>Accessibility</th>" +
		"<th>Best Practices</th>" +
		"<th>Performace</th>" +
		"<th>Progressive Web App</th>" +
		"<th>SEO</th>" +
		"<th>Overall</th>" +
		"<th>PageSpeed Insights</th></tr></thead><tbody>" +
		data.data.reduce((accumulated, result) => {
			const scores = Object.values(result.scores);
			return (
				accumulated +
				`<tr><td><a href="//${result.url.trim()}">${(result.url[result.url.length - 1] === "/" ? result.url : result.url + "/")
					.trim()
					.split(/^(?:https?:\/\/)?.+\..+?(?=\/)/iu)[1]
				}</a></td>` +
				`<td>${result.emulatedFormFactor}</td>` +
				`<td>${scores.map(addEmoji).join("</td><td>")}</td>` +
				`<td>${addEmoji(scores.reduce((a, b) => a + b, 0) / scores.length)}</td><td>` +
				`<a href="//developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent("//"+result.url.trim())}&tab=${result.emulatedFormFactor
				}">More information</a></td></tr>`
			);
		}, "") +
		`</tbody><tfoot><tr><td colspan="2"><b>Overall</b></td>` +
		`<td><b>${allScores.map(addEmoji).join("</b></td><td><b>")}</b></td>` +
		`<td colspan="2"><b><i>${addEmoji(
			allScores.reduce((a, b) => a + b, 0) / allScores.length,
		)}</i></b></td></tr></tbody></table>`
	);
} catch (error) {
	commentOnDiscussion(
		"An error occurred while generating the comment.\n" +
			`\`\`\`js\n${JSON.stringify(error)}\n\`\`\``,
	);

	throw error;
}
