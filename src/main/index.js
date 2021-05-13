"use strict";

const { document } = new (require("jsdom").JSDOM)("").window,
	globby = require("globby"),
	path = require("path"),
	// eslint-disable-next-line new-cap
	router = require("express").Router();

require("dotenv").config();

// This is the list on / with links

const authButtons = Object.assign(document.createElement("ul"), {
		// eslint-disable-next-line id-length
		id: "auth-list",
	}),
	authClients = [],

	// This is the list on /about without links
	authList = Object.assign(document.createElement("ul"), {
		// eslint-disable-next-line id-length
		id: "auth-list",
	});

(async () => {
	// Idk why this is relative to the root dir but it is
	const paths = await globby("src/auth/*/index.js");

	paths.forEach((filepath) => {
		authClients.push(
			require(path.resolve(__dirname.split("/src/")[0], filepath)),
		);
	});

	authClients.forEach((client) => {
		// Add the link

		const link = Object.assign(document.createElement("a"), {
			href: client.link,
		});
		authButtons.append(link);

		// Add the list item

		const listItem = Object.assign(document.createElement("li"), {
			className: "auth-button",
		});

		// Add the icon

		let icon;
		if (client.iconProvider.indexOf("fa") === 0) {
			icon = Object.assign(document.createElement("i"), {
				className: `${client.iconProvider} fa-${client.icon}`,
			});
		} else if (client.iconProvider === "svg") {
			icon = Object.assign(document.createElement("img"), {
				src: `svg/${client.icon}`,
			});
		} else if (client.iconProvider === "url") {
			icon = Object.assign(document.createElement("img"), {
				src: client.icon,
			});
		} else {
			throw new Error(
				`${client.iconProvider} is not a valid icon provider for ${client.name}`,
			);
		}
		Object.assign(icon, {
			alt: `${client.name} logo`,
			height: "18",
			name: client.name,
			width: "18",
		});
		listItem.append(icon);
		authList.append(listItem);
		link.append(listItem.cloneNode(true));

		// Add text

		const span = document.createElement("span"),
			span2 = span.cloneNode(true);
		span.innerHTML = `Sign in with ${client.name}`;
		span2.innerHTML = client.name;
		link.firstElementChild.append(span);
		listItem.append(span2);
	});
	console.log("Dynamic buttons ready");
})();

// Logo

router.get("/logo.svg", (_, res) => {
	res.status(302).redirect(
		"https://cdn.onedot.cf/brand/SVG/NoPadding/1Auth%20NoPad.svg",
	);
});
router.get("/favicon.ico", (_, res) => {
	res.status(302).redirect(
		"https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg",
	);
});
router.get("/svg/:img", (req, res) => {
	res.sendFile(path.resolve(`../svg/${req.params.img}.svg`));
});

console.log("Logos ready");

router.get("/", (req, res) => {
	if (!req.query.url) {
		return res.status(303).redirect("https://auth.onedot.cf/about");
	}
	return res.render(path.resolve("index.html"), {
		buttons: authButtons.outerHTML.replace(
			/{{url}}/g,
			encodeURIComponent(req.query.url),
		),
		url: encodeURIComponent(req.query.url),
	});
});
router.get("/about", (_, res) => {
	res.render(path.resolve("about.html"), {
		clients: authList.outerHTML,
	});
});
console.log("Main pages ready");

router.get("/googleb9551735479dd7b0.html", (_, res) => {
	res.send("google-site-verification: googleb9551735479dd7b0.html");
});
router.get("/robots.txt", (_, res) => {
	res.send(
		"User-agent: *\nAllow: /\nCrawl-delay: 10\nHost: auth.onedot.cf\n",
	);
});
router.get("/.well-known/security.txt", (_, res) => {
	res.status(303).send(process.env.GMAIL_EMAIL);
});
router.get("/humans.txt", (_, res) => {
	res.status(301).send("https://github.com/onedotprojects/auth/people");
});
console.log("SEO ready");

// CSS

const CleanCSS = require("clean-css"),
	fileSystem = require("fs"),
	minify = new CleanCSS();
router.get("/style.css", (_, res) => {
	const text = fileSystem.readFileSync(path.resolve("styl.css"), "utf-8");
	res.setHeader("content-type", "text/css");
	res.send(minify.minify(text).styles);
});
console.log("CSS ready");

module.exports = router;
