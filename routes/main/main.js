var router = require("express").Router();

const { document } = new (require("jsdom").JSDOM)("").window;
const auth_clients = require("../../auth/clients.js");

let auth_list = Object.assign(document.createElement("ul"), {
	id: "auth-list",
}); // this is the list on /about without links
let auth_buttons = Object.assign(document.createElement("ul"), {
	id: "auth-list",
}); // this is the list on / with links
auth_clients.forEach((client) => {
	// add the link
	let link = Object.assign(document.createElement("a"), {
		href: client.link,
	});
	auth_buttons.append(link);

	// add the list item
	let li = Object.assign(document.createElement("li"), {
		className: "auth-button",
	});

	// add the icon
	let icon;
	if (client.iconProvider.indexOf("fa") === 0) {
		icon = Object.assign(document.createElement("i"), {
			className: `${client.iconProvider} fa-${client.icon}`,
		});
	} else if (client.iconProvider === "svg") {
		icon = Object.assign(document.createElement("img"), {
			src: "svg/" + client.icon,
		});
	} else if (client.iconProvider === "url") {
		icon = Object.assign(document.createElement("img"), {
			src: client.icon,
		});
	} else {
		throw new Error(client.iconProvider + " is not a valid icon provider for " + client.name);
	}
	Object.assign(icon, {
		alt: client.name + " logo",
		name: client.name,
		width: "18",
		height: "18",
	});
	li.append(icon);
	auth_list.append(li); // this is appended here and not at L21 because if it was at L21, L47 would only append to auth_list and not to link
	link.append(li.cloneNode(true));
	// add text
	let span = document.createElement("span");
	let span2 = span.cloneNode(true);
	span.innerHTML = "Sign in with " + client.name;
	span2.innerHTML = client.name;
	link.firstElementChild.append(span);
	li.append(span2);
});
console.log("Dynamic buttons ready");
//logo
router.get("/logo.svg", (_, res) => {
	res.sendFile(__dirname + "/1Auth NoPad.svg");
});
router.get("/favicon.ico", (_, res) => {
	res.status(302).redirect("https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg");
});
router.get("/svg/:img", (req, res) => {
	res.sendFile(`/home/runner/auth/auth/svg/${req.params.img}.svg`);
});

console.log("Logos ready");

router.get("/", (req, res) => {
	if (!req.query.url) {
		return res.status(303).redirect("https://auth.onedot.cf/about");
	}
	res.render(__dirname + "/index.html", {
		url: encodeURIComponent(req.query.url),
		buttons: auth_buttons.outerHTML.replace(/{{url}}/g, encodeURIComponent(req.query.url)),
	});
});
router.get("/about", (_, res) => {
	res.render(__dirname + "/about.html", {
		clients: auth_list.outerHTML,
	});
});
console.log("Main pages ready");

router.get("/googleb9551735479dd7b0.html", (req, res) => {
	res.send("google-site-verification: googleb9551735479dd7b0.html");
});
router.get("/robots.txt", (req, res) => {
	res.sendFile(__dirname + "/robots.txt");
});
console.log("SEO ready");
// css
const fs = require("fs");
const cleanCSS = require("clean-css");
const minify = new cleanCSS();
router.get("/bundle-beta.css", (_, res) => {
	text = fs.readFileSync(__dirname + "/bundle-beta.css", "utf-8");
	res.setHeader("content-type", "text/css");
	res.send(minify.minify(text).styles);
});
console.log("CSS ready");

// error/old
router.get("/error", (_, res) => {
	res.status(500).render(__dirname + "/error.html");
});
router.get("/old", (_, res) => {
	res.status(400).render(__dirname + "/old.html");
});
console.log("Error pages ready");

module.exports = router;
