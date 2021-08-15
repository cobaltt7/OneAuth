/**
 * @file Workflow To add commiters to the credits page when their issue is labeled for the related
 *   contribution types.
 */

const isPull = process.env.GITHUB_EVENT_NAME === "pull_request",
	label = process.argv[2],
	username = process.argv[3] || process.argv[4] || process.argv[5];

if (label === "scope: a11y") console.log(`npx all-contributors-cli add ${username} a11y`);

if (label === "type: security") console.log(`npx all-contributors-cli add ${username} security`);

if (label === "scope: i18n") console.log(`npx all-contributors-cli add ${username} translation`);

if (label === "type: announcement" || label === "scope: dependencies")
	console.log(`npx all-contributors-cli add ${username} maintenance`);

if (label.startsWith("type: bug")) console.log(`npx all-contributors-cli add ${username} bug`);

if (isPull) {
	if (label === "scope: documentation")
		console.log(`npx all-contributors-cli add ${username} doc`);

	if (label === "scope: meta") console.log(`npx all-contributors-cli add ${username} infra`);

	if (label === "language: sass" || label === "scope: design")
		console.log(`npx all-contributors-cli add ${username} design`);
} else if (label.startsWith("type: enhancement")) {
	console.log(`npx all-contributors-cli add ${username} ideas`);
}

export default undefined;
