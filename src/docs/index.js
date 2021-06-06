/** @file Documentation. */

const fileSystem = require("fs"),
	highlightjs = require("highlight.js"),
	{ logError } = require("../errors/index.js"),
	marked = require("marked");

// @ts-expect-error
/** @type {import("../../node_modules/live-plugin-manager/dist/src/PluginManager")} */
const packageManager = require("live-plugin-manager"),
	path = require("path"),
	{ promisify } = require("util"),
	// eslint-disable-next-line new-cap
	router = require("express").Router(),
	serveIndex = require("serve-index");

const markedPromise = promisify(marked);

marked.setOptions({
	highlight: (code, originalLanguage, callback) => {
		if (!callback) return logError(new Error("`callback` is falsy"));

		console.log(code, originalLanguage, callback);
		if (!originalLanguage)
			return callback(null, highlightjs.highlightAuto(code).value);
		const language = originalLanguage.toLowerCase();
		// Prevent downloading langs already downloaded or included in core
		if (!highlightjs.getLanguage(language)) {
			packageManager
				.install(`highlightjs-${language}`)
				.then(() => {
					highlightjs.registerLanguage(
						language,
						packageManager.require(`highlightjs-${language}`),
					);
					return callback(
						null,
						highlightjs.highlight(code, { language }).value,
					);
				})
				.catch(() => {
					packageManager
						.install(`${language}-highlightjs`)
						.then(() => {
							highlightjs.registerLanguage(
								language,
								packageManager.require(
									`${language}-highlightjs`,
								),
							);
							return callback(
								null,
								highlightjs.highlight(code, { language }).value,
							);
						})

						.catch(() =>
							callback(
								null,
								highlightjs.highlight(code, {
									language: "plaintext",
								}),
							),
						);
				});
		}
		return callback(null, highlightjs.highlight(code, { language }));
	},
	mangle: false,
	smartLists: true,
	smartypants: true,
	xhtml: true,
});

router.use(
	serveIndex("./src/docs", {
		filter: (filename) => {
			try {
				return /^[^.]+(?:\.md)?$/m.test(filename);
			} catch {
				return true;
			}
		},
		icons: true,
	}),
);

router.get(
	/^[^.]+\.md$/m,
	/**
	 * Strip `.md` from the ends of URLs.
	 *
	 * @param {import("../../types").ExpressRequest} req - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express response object.
	 */
	(req, res) =>
		res.redirect(
			`/docs/${/^\/(?<file>.+).md$/m.exec(req.path)?.groups?.file}`,
		),
);

router.use(
	/**
	 * Handle docs.
	 *
	 * @param {import("../../types").ExpressRequest} req - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @param {import("../../types").ExpressNext} next - Express next function.
	 * @returns {Promise<import("express").IRouter | void>} - Nothing of value.
	 */
	async (req, res, next) => {
		const filename = path.resolve(__dirname, `${req.path.slice(1)}.md`);
		if (fileSystem.existsSync(filename)) {
			const markdown = fileSystem.readFileSync(filename, "utf8");
			return res.render(path.resolve(__dirname, "markdown.html"), {
				content: (await markedPromise(markdown))

					// TODO: change to a custom renderer instead of using `.replace()`
					.replace(/<pre>/g, '<pre class="hljs">'),

				title: /^#\s(?<heading>.+)$/m.exec(markdown)?.groups?.heading,
			});
		}
		return next();
	},
);

module.exports = router;
