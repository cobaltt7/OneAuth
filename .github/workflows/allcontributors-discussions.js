/** @file Determine Which GitHub users have answered discussions before. */

"use strict";

const fetch = require("node-fetch");

const REPO_NAME = "ScratchAddons",
	REPO_OWNER = "ScratchAddons",
	request1 = {
		query: `{
		repository(name: "${REPO_NAME}", owner: "${REPO_OWNER}") {
			discussions(first: 100, orderBy: {direction: DESC, field: CREATED_AT}) {
				edges {
					node { answer { author { login } } }
				}
				totalCount
			}
		}
	}`,
		variables: null,
	};

/**
 * Processes the result given by GraphQL.
 *
 * @param {{ answer: { author: { login: string } } | null }[]} discussions - The result from GraphQL.
 */
function processResult(discussions) {
	return discussions
		.map((discussion) => {
			discussion.answer?.author.login;
		})
		.filter((username) => username);
}

fetch("https://api.github.com/graphql", {
	body: JSON.stringify(request1),
	headers: {
		"authorization": "Bearer 51b83fe12024147aada1ca95b9fd686aba2764d4",
		"graphql-features": "discussions_api",
	},
	method: "POST",
})
	.then((response) => response.json())
	.then(
		async ({
			data: {
				repository: {
					discussions: {
						edges: {
							node: { discussions },
						},
						totalCount,
					},
				},
			},
		}) => {
			const nextRequest = {
				query: `{
					repository(name: "${REPO_NAME}", owner: "${REPO_OWNER}") {
						discussions(
							after: ${discussions.at(-1).cursor},
							first: 100,
							orderBy: {direction: DESC, field: CREATED_AT}
						) {
							edges {
								node { answer { author { login } } }
							}
						}
					}
				}`,
				variables: null,
			};
			console.log(discussions, totalCount);

			const {
				data: {
					repository: {
						discussions: {
							edges: {
								node: { discussions2 },
							},
						},
					},
				},
			} = await fetch("https://api.github.com/graphql", {
				body: JSON.stringify(nextRequest),
				headers: {
					"authorization":
						"Bearer 51b83fe12024147aada1ca95b9fd686aba2764d4",
					"graphql-features": "discussions_api",
				},
				method: "POST",
			}).then((response) => response.json());
			console.log(processResult(discussions2));
		},
	);
