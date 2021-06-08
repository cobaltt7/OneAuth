/** @file Documentation. */

const fileSystem = require("fs"),
	highlightjs = require("highlight.js/lib/core"),
	{ logError } = require("../errors/index.js"),
	marked = require("marked"),
	packageManager = new (require("live-plugin-manager").PluginManager)(),
	path = require("path"),
	{ promisify } = require("util"),
	// eslint-disable-next-line new-cap
	router = require("express").Router(),
	serveIndex = require("serve-index");

highlightjs.registerLanguage(
	"plaintext",
	require("highlight.js/lib/languages/plaintext"),
);

const markedPromise = promisify(marked);

marked.setOptions({
	highlight: (code, originalLanguage, callback) => {
		if (!callback) {
			logError(new TypeError("`callback` is falsy"));
			return;
		}

		console.log(code, originalLanguage, callback);
		if (!originalLanguage) {
			callback(null, highlightjs.highlightAuto(code).value);
			return;
		}
		const language = originalLanguage.toLowerCase();
		// Prevent downloading langs already downloaded or included in core
		if (highlightjs.getLanguage(language)) {
			callback(null, highlightjs.highlight(code, { language }).value);
			return;
		}
		try {
			highlightjs.registerLanguage(
				language,
				require(`highlight.js/lib/languages/${language}`),
			);
			callback(null, highlightjs.highlight(code, { language }).value);
			return;
		} catch {
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

router.get(/^[^.]+\.md$/m, (req, res) =>
	res.redirect(`/docs/${/^\/(?<file>.+).md$/m.exec(req.path)?.groups?.file}`),
);
router.use(async (req, res, next) => {
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
});

module.exports = router;
