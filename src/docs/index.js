/** @file Documentation. */

import fileSystem from "node:fs";
import highlightjs from "highlight.js/lib/core";
import hljsPlaintext from "highlight.js/lib/languages/plaintext";
import { logError } from "../errors/index.js";
import marked from "marked";
import PluginManager from "live-plugin-manager";
import path from "node:path";
import utils from "node:util";
import { Router } from "express";
import serveIndex from "serve-index";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url)),
	packageManager = new PluginManager.PluginManager(),
	router = Router();

highlightjs.registerLanguage("plaintext", hljsPlaintext);

/**
 * Highlights code using highlight.js.
 *
 * @param {string} code - Code to highlight.
 * @param {string} originalLanguage - Language to highlight it with.
 * @param {(error: Error | undefined, code: string) => undefined} [callback] - Callback to run after
 *   highlighing is over.
 */
export function highlight(code, originalLanguage, callback) {
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

	import(`highlight.js/lib/languages/${language}`)
		.then((module) => {
			highlightjs.registerLanguage(language, module.default);

			return callback(undefined, highlightjs.highlight(code, { language }).value);
		})
		.catch(() => {
			packageManager
				.install(`highlightjs-${language}`)
				.then(() => {
					highlightjs.registerLanguage(
						language,
						packageManager.require(`highlightjs-${language}`),
					);

					return callback(undefined, highlightjs.highlight(code, { language }).value);
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
		});
}

const markedPromise = utils.promisify(marked);

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
		response.redirect(`/docs/${/^\/(?<file>.+).md$/m.exec(request.path)?.groups?.file}`),
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
		const filename = path.resolve(directory, `${request.path.slice(1)}.md`);

		if (fileSystem.existsSync(filename)) {
			const markdown = fileSystem.readFileSync(filename, "utf8");

			return response.render(path.resolve(directory, "markdown.html"), {
				content: (await markedPromise(markdown)).replace(/<pre>/g, '<pre class="hljs">'),

				title: /^#\s(?<heading>.+)$/m.exec(markdown)?.groups?.heading,
			});
		}

		return next();
	},
);

export default router;
