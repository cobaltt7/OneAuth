const router = require("express").Router();
const fs = require("fs");
const marked = require("marked");
const highlightjs = require("highlight.js");
const path = require("path");
const jsdom = require("jsdom").JSDOM;
marked.setOptions({
	breaks: false,
	headerIds: true,
	smartLists: true,
	smartypants: true,
	xhtml: true,
	highlight(code) {
		return highlightjs.highlightAuto(code).value;
	},
	mangle: false,
}),
	router.get("/", (req, res) => {
		// send a list of docs
	});

router.get("/:docs", (req, res, next) => {
	const filename = path.resolve(__dirname, `${req.params.docs}.md`);
	if (fs.existsSync(filename)) {
		var markdown = fs.readFileSync(filename, "utf8");
		var html = marked(markdown);
		const { document } = new jsdom(html).window;
		console.log(document.body.innerHTML);
		res.render(path.resolve(__dirname, "markdown.html"), {
			content: html,
			title: document.getElementsByTagName("h1")[0].innerText,
		});
	} else {
		next();
	}
});

module.exports = router;
