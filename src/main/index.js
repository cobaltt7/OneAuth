/** @file Handle Main pages. */

import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

import { load } from "cheerio";
import dotenv from "dotenv";
import { Router as express } from "express";
import { globby } from "globby";

import { highlight as callbackHighlight } from "../docs/index.js";
import { logError } from "../errors/index.js";

const app = express(),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	highlight = promisify(callbackHighlight);

dotenv.config();

/**
 * @type {{
 * 	fontawesome: boolean;
 * 	icon: string;
 * 	iconProvider: string;
 * 	name: string;
 * 	url: boolean;
 * }[]}
 */
const authClients = [],
	clientPromises = [],
	// Idk why this is relative to the root dir but it is
	paths = await globby("src/auth/*/index.js");

for (const filepath of paths) clientPromises.push(import(`../../${filepath}`));

for (const { default: client } of await Promise.all(clientPromises)) {
	authClients.push({
		fontawesome: client.iconProvider.indexOf("fa") === 0,
		icon: client.icon,
		iconProvider: client.iconProvider,
		name: client.name,
		url: client.iconProvider === "url",
	});
}

// Highlighting
app.use((_, response, next) => {
	const realSend = response.send;

	/**
	 * Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use`send` internally.
	 *
	 * @param {any} text -- Data to send.
	 */
	// @ts-expect-error -- Yes, it no longer returns `Response`. But, unfortunately, it can't anymore.
	// eslint-disable-next-line no-param-reassign -- We need to override the original functions.
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

		codeblocks.map(
			/**
			 * Highlight a code block using highlight.js.
			 *
			 * @param {number} index - Iteration of the loop.
			 *
			 * @returns {number} - The index of the loop.
			 */
			(index) => {
				const code = codeblocks.eq(index),
					[fullClass, language = "plaintext"] =
						/lang(?:uage)?-(?<language>\w+)/u.exec(code.attr("class") || "") || [];

				code.removeClass(fullClass);
				highlight(code.text(), language)
					.then((highlighted) => {
						code.html(highlighted).wrapInner(
							jQuery(`<code class="language-${language}"></code>`),
						);

						if (index + 1 === codeblocks.length)
							return realSend.call(response, jQuery.html());

						return response;
					})
					.catch(logError);

				return index;
			},
		);
	};

	return next();
});

// Logos
app.get("/logo.svg", (_, response) =>
	response.status(302).redirect("https://cdn.onedot.cf/brand/SVG/NoPadding/1Auth%20NoPad.svg"),
);
app.get("/favicon.ico", (_, response) =>
	response.status(302).redirect("https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg"),
);
app.get("/", (_, response) =>
	response.render(path.resolve(directory, "about.html"), {
		clients: authClients,
	}),
);

app.get("/.well-known/security.txt", (_, response) =>
	response.status(303).send(`Contact: mailto:${process.env.GMAIL_EMAIL}
Expires: 2107-10-07T05:13:00.000Z
Acknowledgments: https://auth.onedot.cf/docs/credits
Preferred-Languages: en_US
Canonical: https://auth.onedot.cf/.well-known/security.txt`),
);

app.get("/humans.txt", (_, response) =>
	response.status(301).redirect("https://github.com/onedotprojects/auth/people"),
);

// CSS
app.get("/style.css", (_, response) => {
	response.setHeader("content-type", "text/css");

	return response.render(path.resolve(directory, "style.css"));
});

export default app;
