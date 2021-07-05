"use strict";

/** @file Documentation. */

const fileSystem = require("fs"),
	highlightjs = require("highlight.js/lib/core"),
	{ logError } = require("../errors"),
	marked = require("marked"),
	// eslint-disable-next-line node/global-require -- I don't want to move it higher up to use the variable once. Plus there's a type error...?
	packageManager = new (require("live-plugin-manager").PluginManager)(),
	path = require("path"),
	// eslint-disable-next-line prefer-destructuring -- Apparently there's a type error if I use it?
	promisify = require("util").promisify,
	// eslint-disable-next-line new-cap -- We didn't name this.
	router = require("express").Router(),
	serveIndex = require("serve-index");

highlightjs.registerLanguage(
	"plaintext",
	require("highlight.js/lib/languages/plaintext"),
);

/**
 * Highlights code using highlight.js.
 *
 * @param {string} code - Code to highlight.
 * @param {string} originalLanguage - Language to highlight it with.
 * @param {(error: Error | undefined, code: string) => undefined} [callback] - Callback to run after
 *   highlighing is over.
 */
function highlight(code, originalLanguage, callback) {
	if (!callback) {
		logError(new TypeError("`callback` is falsy"));

		return;
	}

	if (!originalLanguage) {
		callback(undefined, highlightjs.highlightAuto(code).value);

		return;
	}

	const language = originalLanguage.toLowerCase();

	// Prevent downloading langs already downloaded or included in core
	if (highlightjs.getLanguage(language)) {
		callback(undefined, highlightjs.highlight(code, { language }).value);

		return;
	}

	try {
		highlightjs.registerLanguage(
			language,
			// eslint-disable-next-line node/global-require -- We can't move this to a higher scope.
			require(`highlight.js/lib/languages/${language}`),
		);

		const response = highlightjs.highlight(code, { language });

		callback(undefined, response.value);

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
					undefined,
					highlightjs.highlight(code, { language }).value,
				);
			})
			.catch(() => {
				packageManager
					.install(`${language}-highlightjs`)
					.then(() => {
						highlightjs.registerLanguage(
							language,
							packageManager.require(`${language}-highlightjs`),
						);

						return callback(
							undefined,
							highlightjs.highlight(code, { language }).value,
						);
					})
					.catch(() =>
						callback(
							undefined,
							highlightjs.highlight(code, {
								language: "plaintext",
							}).value,
						),
					);
			});
	}
}

const markedPromise = promisify(marked);

marked.setOptions({
	highlight,
	mangle: false,
	smartLists: true,
	smartypants: true,
	xhtml: true,
});

router.use(
	// TODO: Use our own system instead of `serve-index`.
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
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {undefined}
	 */
	(request, response) =>
		response.redirect(
			`/docs/${/^\/(?<file>.+).md$/m.exec(request.path)?.groups?.file}`,
		),
);
router.use(
	/**
	 * Handle docs.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => undefined} next - Express continue function.
	 *
	 * @returns {Promise<undefined>}
	 * @todo Change to a custom renderer instead of using `.replace()`.
	 */
	async (request, response, next) => {
		const filename = path.resolve(__dirname, `${request.path.slice(1)}.md`);

		if (fileSystem.existsSync(filename)) {
			const markdown = fileSystem.readFileSync(filename, "utf8");

			return response.render(path.resolve(__dirname, "markdown.html"), {
				content: (await markedPromise(markdown)).replace(
					/<pre>/g,
					'<pre class="hljs">',
				),

				title: /^#\s(?<heading>.+)$/m.exec(markdown)?.groups?.heading,
			});
		}

		return next();
	},
);

module.exports = { highlight, router };
