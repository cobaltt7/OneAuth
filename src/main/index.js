/** @file Handle Main pages. */

import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

import { load } from "cheerio";
import dotenv from "dotenv";
import { Router as express } from "express";

import authClients from "../../lib/clients.js";
import callbackHighlight from "../../lib/highlighting.js";

const app = express(),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	highlight = promisify(callbackHighlight);

dotenv.config();

// Highlighting
app.use((_, response, next) => {
	const realSend = response.send;

	/**
	 * Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use`send` internally.
	 *
	 * @param {any} text -- Data to send.
	 *
	 * @returns {void}
	 */
	// @ts-expect-error -- Yes, it no longer returns `Response`. But, unfortunately, it can't anymore.
	response.send = (text) => {
		if (typeof text !== "string") {
			realSend.call(response, text);

			return;
		}

		const jQuery = load(text);
		// eslint-disable-next-line one-var -- `codeblocks` depends on `jQuery`
		const codeblocks = jQuery("pre.hljs:not(:has(*))");

		if (!codeblocks?.length) {
			realSend.call(response, text);

			return;
		}

		codeblocks.map(async (index) => {
			const code = codeblocks.eq(index),
				[fullClass, language = "plaintext"] =
					/lang(?:uage)?-(?<language>\w+)/u.exec(code.attr("class") || "") || [];

			code.removeClass(fullClass);

			code.html(
				`<code class="language-${language}">${await highlight(
					code.text(),
					language,
				)}</code>`,
			);

			if (index + 1 === codeblocks.length) realSend.call(response, jQuery.html());
		});
	};

	return next();
});

// Logos
app.get("/logo.svg", (_, response) =>
	response.status(302).redirect("https://onedot.cf/brand/auth/full.svg"),
);
app.get("/favicon.ico", (_, response) =>
	response.status(302).redirect("https://onedot.cf/brand/auth/mini.svg"),
);
app.all("/", (_, response) =>
	response.render(path.resolve(directory, "about.html"), {
		clients: authClients,
	}),
);

app.all("/privacy", (_, response) => response.render(path.resolve(directory, "privacy.html")));
app.all("/branding", (_, response) => response.render(path.resolve(directory, "branding.html")));

app.all("/humans.txt", (_, response) =>
	response.status(301).redirect("https://github.com/onedotprojects/auth/people"),
);

// CSS
app.all("/style.css", (_, response) => {
	response.setHeader("content-type", "text/css");

	return response.render(path.resolve(directory, "style.css"));
});

export default app;
