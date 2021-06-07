/** @file Handle Main pages. */

const globby = require("globby"),
	path = require("path"),
	// eslint-disable-next-line new-cap
	router = require("express").Router();

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

// Logo

router.get(
	"/logo.svg",
	/**
	 * Redirect to the 1Auth logo.
	 *
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
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
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
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
	 * @param {import("../../types").ExpressRequest} req - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
	 */
	(req, res) =>
		res.sendFile(path.resolve(__dirname, `../svg/${req.params.img}.svg`)),
);

router.get(
	"/",
	/**
	 * Send the about page.
	 *
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
	 */
	(_, res) =>
		res.render(path.resolve(__dirname, "about.html"), {
			clients: authClients,
		}),
);

router.get(
	"/about",
	/**
	 * For backwards compatibility. Redirect to the home page.
	 *
	 * @deprecated
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
	 */
	(_, res) => res.status(303).redirect("https://auth.onedot.cf/"),
);

router.get(
	"/googleb9551735479dd7b0.html",
	/**
	 * Verify ownership of the domain with Google.
	 *
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
	 */
	(_, res) =>
		res.send("google-site-verification: googleb9551735479dd7b0.html"),
);

router.get(
	"/robots.txt",
	/**
	 * Send information to web crawlers.
	 *
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
	 */
	(_, res) =>
		res.send(
			"User-agent: *\n" +
				"Allow: /\n" +
				"Disalow: /auth\n" +
				"Crawl-delay: 10\n" +
				"Host: https://auth.onedot.cf",
		),
);

router.get(
	"/.well-known/security.txt",
	/**
	 * Send information on how to contact us to report a security bug.
	 *
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
	 */
	(_, res) => res.status(303).send(`${process.env.GMAIL_EMAIL}`),
);

router.get(
	"/humans.txt",
	/**
	 * Redirect to the onedotprojects/auth contributors page on GitHub.
	 *
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 * @returns {import("express").IRouter} - Express router instance.
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
	 * @param {import("../../types").ExpressRequest} _ - Express request object.
	 * @param {import("../../types").ExpressResponse} res - Express response object.
	 */
	(_, res) => {
		res.setHeader("content-type", "text/css");
		res.render(path.resolve(__dirname, "style.css"));
	},
);

module.exports = router;
