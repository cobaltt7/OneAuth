"use strict";

const fileSystem = require("fs"),
	highlightjs = require("highlight.js"),
	marked = require("marked"),
	path = require("path"),
	// eslint-disable-next-line new-cap
	router = require("express").Router(),
	serveIndex = require("serve-index");

marked.setOptions({
	breaks: false,
	headerIds: true,
	highlight: (code) => highlightjs.highlightAuto(code).value,
	mangle: false,
	smartLists: true,
	smartypants: true,
	xhtml: true,
});

router.use(
	serveIndex("./src/docs", {
		filter: /^[^.]+(?:\.md)?$/m.test,
		icons: true,
	}),
);

router.get(/^[^.]+\.md$/m, (req, res) => {
	res.redirect(`/docs/${/^\/(?<file>.+).md$/m.exec(req.url).groups.file}`);
});

router.use((req, res, next) => {
	const filename = path.resolve(__dirname, `${req.url.slice(1)}.md`);
	if (fileSystem.existsSync(filename)) {
		const markdown = fileSystem.readFileSync(filename, "utf8");
		return res.render(path.resolve(__dirname, "markdown.html"), {
			content: marked(markdown),
			title: /^#\s(?<heading>.+)$/m.exec(markdown).groups.heading,
		});
	}
	return next();
});

module.exports = router;
