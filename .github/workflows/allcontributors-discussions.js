/** @file Determine Which GitHub users have answered discussions before. */

"use strict";

const fetch = require("node-fetch");

const REPO_NAME = "onedotprojects",
	REPO_OWNER = "auth",
	/** @type {string[][]} */
	result = [];

/**
 * Get a page of discussions based on a previous discussion's hash.
 *
 * @param {string} [hash] - Retrieve all issues after this hash. If no hash is provided or the hash
 *   is blank, the first page will be returned.
 * @param {boolean} [total] - Whether or not to return the total number of discussions in the repository.
 *
 * @returns {Promise<{ discussions: { username: string; cursor: string }[]; total?: number }>} - The
 *   retrieved discussion information.
 */
async function getPage(hash = "", total = false) {
	const nextRequest = {
			query: `{
			repository(name: "${REPO_NAME}", owner: "${REPO_OWNER}") {
				discussions(
					${hash ? `after: "${hash}",` : ""}
					first: 100,
					orderBy: {direction: DESC, field: CREATED_AT}
				) {
					edges {
						cursor
						node { answer { author { login } } }
					}
					${total ? "totalCount" : ""}
				}
			}
		}`,
			variables: null,
		},
		/**
		 * @type {{
		 * 	data: {
		 * 		repository: {
		 * 			discussions: {
		 * 				edges: {
		 * 					cursor: string;
		 * 					node: { answer: { author: { login: string } } | null };
		 * 				}[];
		 * 				totalCount: number;
		 * 			};
		 * 		};
		 * 	};
		 * }}
		 */
		{
			data: {
				repository: {
					discussions: { edges: discussions, totalCount },
				},
			},
		} = await fetch("https://api.github.com/graphql", {
			body: JSON.stringify(nextRequest),
			headers: {
				"Authorization": `Bearer ${process.argv[2]}`,
				"GraphQL-Features": "discussions_api",
			},
			method: "POST",
		}).then((response) => response.json()),
		/** @type {{ cursor: string; username: string }[]} */
		// @ts-expect-error - TS thinks `username` may contain `undefined` values.
		// That's impossible. See L83.
		processedDiscussions = discussions
			.map((discussion) => ({
				cursor: discussion.cursor,
				username: discussion.node.answer?.author?.login,
			}))
			.filter((discussion) => discussion.username);
	if (total) return { discussions: processedDiscussions, total: totalCount };
	return { discussions: processedDiscussions };
}

getPage("", true).then(async ({ discussions, total }) => {
	let discussionIndex = discussions.length,
		hash = discussions[discussions.length - 1]?.cursor;
	if (!total || !hash) {
		throw new Error(
			`\`total\` or \`hash\` is falsy! \`hash\`: ${hash}. \`total\`: ${total}.`,
		);
	}
	result.push(discussions.map((discussion) => discussion.username));
	while (discussionIndex < total) {
		/** @type {{ username: string; cursor: string }[]} */
		// eslint-disable-next-line no-await-in-loop
		const nextDiscussions = (await getPage(hash)).discussions;
		hash = nextDiscussions[nextDiscussions.length - 1]?.cursor;
		discussionIndex += nextDiscussions.length;
		result.push(nextDiscussions.map((discussion) => discussion.username));
	}

	/** @type {{ [key: string]: number }} */
	const top = {};
	result.flat().forEach((name) => {
		if (!top[name]) top[name] = 0;
		top[name]++;
	});
	console.log(top);
});
