"use strict";

const github = require("@actions/github");

const octokit = github.getOctokit(process.argv[2]);

console.log(process.argv[3])
const {data} = JSON.parse(process.argv[3]);


let OUTPUT =
	`# This week's Lighthouse scores\n` +
	`URL|Accessibility|Best Practices|Performace|Progressive Web App|SEO\n` +
	`-|-|-|-|-|-\n`;

data.forEach((result) => {
	OUTPUT += `${result.url}|${Object.values(result.scores).join("|")}\n`;
});

console.log(data);
octokit.issues.createComment({
	...github.context.repo,
	issue_number: "27",
	body: OUTPUT,
});
