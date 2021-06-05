/** @file Documentation. */

const fileSystem = require("fs"),
	highlightjs = require("highlight.js"),
	marked = require("marked"),
	path = require("path"),
package = new (require("live-plugin-manager"))(),
	// eslint-disable-next-line new-cap
	router = require("express").Router(),
	serveIndex = require("serve-index");

marked.setOptions({
	highlight: async (code, lang) => {
// prevent downloading langs already downloaded or included in core
  if (!highlightjs.getLanguage(lang)) {
    let externalGrammar
    try {
      await package.install("highlightjs-" + lang);
      externalGrammar = package.require("highlightjs-" + lang);
    } catch {
      try {
        await package.install(lang + "-highlightjs");
        externalGrammar = package.require(lang + "-highlightjs");
      } catch {
      }
    }
    if (externalGrammar) {
      highlights.registerLanguage("lang", externalGrammar);
    }
  }
return (highlightjs.getLanguage(lang) ? highlightjs.highlight(code, { language:  lang }): highlightjs.highlightAuto(code)).value;
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

router.get(
	/^[^.]+\.md$/m,
	/**
	 * Strip `.md` from the ends of URLs.
	 *
	 * @param {import("../../types").ExpressRequest} req - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express response object.
	 */
	(req, res) =>
		res.redirect(
			`/docs/${/^\/(?<file>.+).md$/m.exec(req.path)?.groups?.file}`,
		),
);

router.use(
	/**
	 * Handle docs.
	 *
	 * @param {import("../../types").ExpressRequest} req - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @param {import("../../types").ExpressNext} next - Express next function.
	 * @returns {import("express").IRouter | void} - Nothing of value.
	 */
	(req, res, next) => {
		const filename = path.resolve(__dirname, `${req.path.slice(1)}.md`);
		if (fileSystem.existsSync(filename)) {
			const markdown = fileSystem.readFileSync(filename, "utf8");
			return res.render(path.resolve(__dirname, "markdown.html"), {
				content: marked(markdown).replace(
					/<pre>/g,
					'<pre class="hljs">',
				),
				title: /^#\s(?<heading>.+)$/m.exec(markdown)?.groups?.heading,
			});
		}
		return next();
	},
);

module.exports = router;
