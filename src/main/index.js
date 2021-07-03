"use strict";

/** @file Handle Main pages. */

const cheerio = require("cheerio"),
	globby = require("globby"),
	{ logError } = require("../errors"),
	path = require("path"),
	{ promisify } = require("util"),
	// eslint-disable-next-line new-cap -- We didn't name this.
	router = require("express").Router();

const highlight = promisify(require("../docs").highlight);

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

	for (const filepath of paths) {
		// eslint-disable-next-line node/global-require -- We can't move this to a higher scope.
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
	}
})();

// Highlighting
router.use(
	/**
	 * Express middleware to handle code block highlighting.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} response - Express response object.
	 * @param {(error?: any) => void} next - Express continue function.
	 *
	 * @returns {void}
	 */
	(_, response, next) => {
		const realSend = response.send;

		/**
		 * Also applys to `sendFile`, `sendStatus`, `render`, and ect., which all use`send` internally.
		 *
		 * @param {string} text - The text to send.
		 *
		 * @returns {void}
		 */
		// eslint-disable-next-line no-param-reassign -- We need to override the original functions.
		response.send = (text) => {
			const jQuery = cheerio.load(text);
			// eslint-disable-next-line one-var -- `codeblocks` depends on `jQuery`
			const codeblocks = jQuery("pre.hljs:not(:has(*))");
			if (!codeblocks?.length) {
				realSend.call(response, jQuery.html());
				next();
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
						[langClass, language = "plaintext"] =
							/lang(?:uage)?-(?<language>\w+)/u.exec(
								code.attr("class"),
							) ?? [];

					code.removeClass(langClass);
					highlight(code.text(), language)
						.then((highlighted) => {
							code.html(highlighted);
							code.wrapInner(
								jQuery(
									`<code class="language-${language}"></code>`,
								),
							);

							if (index + 1 === codeblocks.length)
								return realSend.call(this, jQuery.html());

							return response;
						})
						.catch(logError);

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
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) =>
		response
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
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) =>
		response
			.status(302)
			.redirect("https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg"),
);
router.get(
	"/svg/:img",

	/**
	 * Send SVG file from the `../svg` folder.
	 *
	 * @param {e.Request} request - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(request, response) =>
		response.sendFile(
			path.resolve(__dirname, `../svg/${request.params?.img}.svg`),
		),
);

router.get(
	"/",

	/**
	 * Send the about page.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) =>
		response.render(path.resolve(__dirname, "about.html"), {
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
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) => response.status(303).redirect("https://auth.onedot.cf/"),
);

router.get(
	"/googleb9551735479dd7b0.html",

	/**
	 * Verify ownership of the domain with Google.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) =>
		response.send("google-site-verification: googleb9551735479dd7b0.html"),
);

router.get(
	"/robots.txt",

	/**
	 * Send information to web crawlers.
	 *
	 * @param {e.Request} _ - Express request object.
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) =>
		response.send(
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
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) =>
		response.status(303).send(`Contact: mailto:${process.env.GMAIL_EMAIL}
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
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) =>
		response
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
	 * @param {e.Response} response - Express response object.
	 *
	 * @returns {void}
	 */
	(_, response) => {
		response.setHeader("content-type", "text/css");

		return response.render(path.resolve(__dirname, "style.css"));
	}
);

module.exports = router;
