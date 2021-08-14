/** @file Documentation. */

import fileSystem from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

import { Router as express } from "express";
import marked from "marked";
import serveIndex from "serve-index";

import highlight from "../../lib/highlighting.js";

const app = express(),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	markedPromise = promisify(marked);

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

app.all(/^[^.]+\.md$/m, (request, response) =>
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
