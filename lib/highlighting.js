/** @file Highlights Code using highlight.js. */

// eslint-disable-next-line import/extensions -- This module breaks with the extention
import highlightjs from "highlight.js/lib/core";
// eslint-disable-next-line import/extensions -- This module breaks with the extention
import hljsPlaintext from "highlight.js/lib/languages/plaintext";
import PluginManager from "live-plugin-manager";

import { logError } from "../src/errors/index.js";

const packageManager = new PluginManager.PluginManager();

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
 *   highlighing is finished.
 */
export default function highlight(code, originalLanguage, callback) {
	if (!callback) {
		logError(new TypeError("`callback` is falsy"));

		return;
	}

	if (!originalLanguage) {
		callback(undefined, highlightjs.highlightAuto(code).value);

		return;
	}

	const language = originalLanguage.toLowerCase();

	// Prevent downloading languages already downloaded or included in core
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
