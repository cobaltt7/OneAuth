/** @file Handle Main pages. */

const cheerio = require("cheerio"),
	globby = require("globby"),
	path = require("path"),
	// eslint-disable-next-line prefer-destructuring
	promisify = require("util").promisify,
	// eslint-disable-next-line new-cap
	router = require("express").Router();

const highlight = promisify(require("../docs/index.js").highlight);

require("dotenv").config();

/**
 * @type {{
 * 	fontawesome: boolean;
 * 	icon: string;
 * 	iconProvider: string;
 * 	name: string;
 * 	svg: boolean;
 * }[]}
 */
const authClients = [];

(async () => {
	// Idk why this is relative to the root dir but it is
	const paths = await globby("src/auth/*/index.js");

	paths.forEach((filepath) => {
		const { iconProvider, icon, name } = require(path.resolve(
			__dirname.split("/src/")[0],
			filepath,
		));
		authClients.push({
			fontawesome: iconProvider.indexOf("fa") === 0,
			icon,
			iconProvider,
			name,
			svg: iconProvider === "svg",
		});
	});
})();

// Highlighting
router.use(
	/**
	 * Express middleware to handle code block highlighting.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} result - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 *
	 * @returns {void}
	 */
	(_, result, next) => {
		const realSend = result.send;

		// Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use`send` internally.
		result.send = (text) => {
			const jQuery = cheerio.load(text);

			// eslint-disable-next-line one-var -- `codeblocks` depends on `jQuery`
			const codeblocks = jQuery("pre.hljs:not(:has(*))");

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
						[langClass, language = "plaintext"] =
							/lang(?:uage)?-(?<language>\w+)/u.exec(
								code.attr("class"),
							) ?? [];
					code.removeClass(langClass);
					highlight(code.text(), language).then((highlighted) => {
						code.html(highlighted);
						code.wrapInner(
							jQuery(
								`<code class="language-${language}"></code>`,
							),
						);
						if (index + 1 === codeblocks.length)
							return realSend.call(result, jQuery.html());

						return result;
					});
					return index;
				},
			);
		};
		return next();
	},
);

// Logos
router.get(
	"/logo.svg",
	/**
	 * Redirect to the 1Auth logo.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) =>
		res
			.status(302)
			.redirect(
				"https://cdn.onedot.cf/brand/SVG/NoPadding/1Auth%20NoPad.svg",
			),
);
router.get(
	"/favicon.ico",
	/**
	 * Redirect to the 1Auth "1" mini-logo.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) =>
		res
			.status(302)
			.redirect("https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg"),
);
router.get(
	"/svg/:img",
	/**
	 * Send SVG file from the `../svg` folder.
	 *
	 * @param {e.Request} req - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(req, res) =>
		res.sendFile(path.resolve(__dirname, `../svg/${req.params?.img}.svg`)),
);

router.get(
	"/",
	/**
	 * Send the about page.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) =>
		res.render(path.resolve(__dirname, "about.html"), {
			clients: authClients,
		}),
);

router.get(
	"/about",
	/**
	 * Redirect to the home page.
	 *
	 * @deprecated - For backwards compatibility only.
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) => res.status(303).redirect("https://auth.onedot.cf/"),
);

router.get(
	"/googleb9551735479dd7b0.html",
	/**
	 * Verify ownership of the domain with Google.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) =>
		res.send("google-site-verification: googleb9551735479dd7b0.html"),
);

router.get(
	"/robots.txt",
	/**
	 * Send information to web crawlers.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) =>
		res.send(
			"User-agent: *\n" +
				"Allow: /\n" +
				"Disalow: /auth\n" +
				"Host: https://auth.onedot.cf",
		),
);

router.get(
	"/.well-known/security.txt",
	/**
	 * Send information on how to contact us to report a security bug.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) =>
		res.status(303).send(`Contact: mailto:${process.env.GMAIL_EMAIL}
Expires: 2107-10-07T05:13:00.000Z
Acknowledgments: https://auth.onedot.cf/docs/credits
Preferred-Languages: en_US
Canonical: https://auth.onedot.cf/.well-known/security.txt`),
);

router.get(
	"/humans.txt",
	/**
	 * Redirect to the onedotprojects/auth contributors page on GitHub.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 *
	 * @returns {void}
	 */
	(_, res) =>
		res
			.status(301)
			.redirect("https://github.com/onedotprojects/auth/people"),
);

// CSS
router.get(
	"/style.css",
	/**
	 * Send styles.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} res - Express response object.
	 */
	(_, res) => {
		res.setHeader("content-type", "text/css");
		res.render(path.resolve(__dirname, "style.css"));
	},
);

module.exports = router;
