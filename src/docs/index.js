/** @file Documentation. */

import fileSystem from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

import { Router as express } from "express";
// eslint-disable-next-line import/extensions -- This module breaks with the extention
import highlightjs from "highlight.js/lib/core";
// eslint-disable-next-line import/extensions -- This module breaks with the extention
import hljsPlaintext from "highlight.js/lib/languages/plaintext";
import PluginManager from "live-plugin-manager";
import marked from "marked";
import serveIndex from "serve-index";

import { logError } from "../errors/index.js";

const app = express(),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	packageManager = new PluginManager.PluginManager();

highlightjs.registerLanguage("plaintext", (hljs) => ({
	...hljsPlaintext(hljs),
	contains: [],
}));

/**
 * Highlights code using highlight.js.
 *
 * @param {string} code - Code to highlight.
 * @param {string} originalLanguage - Language to highlight it with.
 * @param {(error: Error | undefined, code: string) => void} [callback] - Callback to run after
 *   highlighing is over.
 * @todo Move highlighting elsewhere?
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
		.then(({ default: highlighter }) => {
			highlightjs.registerLanguage(language, highlighter);

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

const markedPromise = promisify(marked);

marked.setOptions({
	highlight,
	mangle: false,
	smartLists: true,
	smartypants: true,
	xhtml: true,
});

app.use(
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

app.get(/^[^.]+\.md$/m, (request, response) =>
	response.redirect(`/docs/${/^\/(?<file>.+).md$/m.exec(request.path)?.groups?.file}`),
);
app.use(async (request, response, next) => {
	const filename = path.resolve(directory, `${request.path.slice(1)}.md`);

	if (fileSystem.existsSync(filename)) {
		const markdown = fileSystem.readFileSync(filename, "utf8");

		return response.render(path.resolve(directory, "markdown.html"), {
			// TODO: Change to a custom renderer instead of using `.replace()`.
			content: (await markedPromise(markdown)).replace(/<pre>/g, '<pre class="hljs">'),

			title: /^#\s(?<heading>.+)$/m.exec(markdown)?.groups?.heading,
		});
	}

	return next();
});

export default app;
