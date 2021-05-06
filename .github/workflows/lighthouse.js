"use strict";

const github = require("@actions/github");
const octokit = github.getOctokit(process.argv[2]);

const { data } = JSON.parse(process.argv[3]);

let OUTPUT =
	`# This week's Lighthouse scores\n` +
	`URL|Device|Accessibility|Best Practices|Performace|Progressive Web App|SEO|More Info\n` +
	`-|-|-|-|-|-|-\n`;

data.forEach(
	(result) =>
		(OUTPUT += `${result.url}|${result.emulatedFormFactor}|${Object.values(result.scores).join(
			"|",
		)}|https://developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent(
			result.url,
		)}&tab=${result.emulatedFormFactor}\n`),
);

octokit.issues.create({
	...github.context.repo,
	title: "Lighthouse Performance Updates",
	body: "I will post Lighthouse performance updates here weekly!",
});

octokit.issues.createComment({
	...github.context.repo,
	issue_number: "29",
	body: OUTPUT,
});
