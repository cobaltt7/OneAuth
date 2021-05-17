"use strict";

const globby = require("globby"),
	path = require("path"),
	// eslint-disable-next-line new-cap
	router = require("express").Router();

require("dotenv").config();

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

router.get("/logo.svg", (_, res) => {
	res.status(302).redirect(
		"https://cdn.onedot.cf/SVG/NoPadding/1Auth%20NoPad.svg",
	);
});
router.get("/favicon.ico", (_, res) => {
	res.status(302).redirect("https://cdn.onedot.cf/SVG/Transparent/Auth.svg");
});
router.get("/svg/:img", (req, res) => {
	res.sendFile(path.resolve(__dirname, `../svg/${req.params.img}.svg`));
});

router.get("/", (_, res) =>
	res.render(path.resolve(__dirname, "about.html"), {
		clients: authClients,
	}),
);

router.get("/about", (_, res) =>
	res.status(303).redirect("https://auth.onedot.cf/"),
);

router.get("/googleb9551735479dd7b0.html", (_, res) => {
	res.send("google-site-verification: googleb9551735479dd7b0.html");
});

router.get("/robots.txt", (_, res) => {
	res.send(
		"User-agent: *\n" +
			"Allow: /\n" +
			"Disalow: /auth\n" +
			"Crawl-delay: 10\n" +
			"Host: https://auth.onedot.cf",
	);
});

router.get("/.well-known/security.txt", (_, res) => {
	res.status(303).send(process.env.GMAIL_EMAIL);
});

router.get("/humans.txt", (_, res) => {
	res.status(301).redirect("https://github.com/onedotprojects/auth/people");
});

// CSS
router.get("/style.css", (_, res) => {
	res.setHeader("content-type", "text/css");
	// TODO: minify the file. We were using CleanCSS (thanks @GrahamSH-LLK) but I couldn't do that if we wanted to translate `content` properties. There is probably a PostCSS plugin, I just need to find it.
	res.render(path.resolve(__dirname, "style.css"));
});

module.exports = router;
