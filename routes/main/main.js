"use strict";

const authClients = require("../../auth/clients.js"),
	{ document } = new (require("jsdom").JSDOM)("").window,
	router = require("express").Router();

// This is the list on / with links
const authButtons = Object.assign(document.createElement("ul"), {
		// eslint-disable-next-line id-length
		id: "auth-list",
	}),
	// This is the list on /about without links
	authList = Object.assign(document.createElement("ul"), {
		// eslint-disable-next-line id-length
		id: "auth-list",
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
			`${client.iconProvider} is not a ` +
				`valid icon provider for ${client.name}`,
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
// Logo
router.get("/logo.svg", (_, res) => {
	res.sendFile(`${__dirname}/1Auth NoPad.svg`);
});
router.get("/favicon.ico", (_, res) => {
	res.status(302).redirect(
		"https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg",
	);
});
router.get("/svg/:img", (req, res) => {
	res.sendFile(`/home/runner/auth/routes/svg/${req.params.img}.svg`);
});

console.log("Logos ready");

router.get("/", (req, res) => {
	if (!req.query.url) {
		return res.status(303).redirect("https://auth.onedot.cf/about");
	}
	return res.render(`${__dirname}/index.html`, {
		buttons: authButtons.outerHTML.replace(
			/{{url}}/g,
			encodeURIComponent(req.query.url),
		),
		url: encodeURIComponent(req.query.url),
	});
});
router.get("/about", (_, res) => {
	res.render(`${__dirname}/about.html`, {
		clients: authList.outerHTML,
	});
});
console.log("Main pages ready");

router.get("/googleb9551735479dd7b0.html", (_, res) => {
	res.send("google-site-verification: googleb9551735479dd7b0.html");
});
router.get("/robots.txt", (_, res) => {
	res.sendFile(`${__dirname}/robots.txt`);
});
console.log("SEO ready");
// CSS
const CleanCSS = require("clean-css"),
	fileSystem = require("fs"),
	minify = new CleanCSS();
router.get("/style.css", (_, res) => {
	const text = fileSystem.readFileSync(`${__dirname}/style.css`, "utf-8");
	res.setHeader("content-type", "text/css");
	res.send(minify.minify(text).styles);
});
console.log("CSS ready");

// Errors
router.get("/error", (_, res) => {
	res.status(500).render(`${__dirname}/error.html`);
});
router.get("/old", (_, res) => {
	res.status(400).render(`${__dirname}/old.html`);
});
console.log("Error pages ready");

module.exports = router;
