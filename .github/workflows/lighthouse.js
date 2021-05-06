"use strict";

const github = require("@actions/github");
const octokit = github.getOctokit(process.argv[2]);

const { data } = JSON.parse(process.argv[3]);

let OUTPUT =
	`# This week's Lighthouse scores\n` +
	`| URL | Device | Accessibility | Best Practices | Performace | Progressive Web App | SEO | PageSpeed Insights |\n` +
	`| - | - | - | - | - | - | - | - |\n`;

data.forEach(
	(result) =>
		(OUTPUT += `| ${result.url} | ${result.emulatedFormFactor} | ${Object.values(result.scores)
			.map((n) => (n < 50 ? "🔴" : n < 90 ? "🟡" : "🟢") + " " + n)
			.join(
				" | ",
			)} | [More information](https://developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent(
			result.url,
		)}&tab=${result.emulatedFormFactor}) |\n`),
);

octokit.issues.createComment({
	...github.context.repo,
	// jshint camelcase:false
	issue_number: "29",
	// jshint camelcase:true
	body: OUTPUT,
});
