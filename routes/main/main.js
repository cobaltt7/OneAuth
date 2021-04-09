const CleanCSS = require("clean-css");
var minify = new CleanCSS();
const zlib = require("zlib");
const fs = require("fs");
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
	if (client.iconProvider === "fa") {
		icon = Object.assign(document.createElement("i"), {
			className: "fab fa-" + client.icon,
		});
	} else if (client.iconProvider === "svg") {
		icon = Object.assign(document.createElement("img"), {
			className: "svg-inline--fa",
			src: client.icon + ".svg",
			alt: client.name + " logo",
			name: client.name,
			width: "16",
			height: "16",
		});
	} else {
		throw new Error(client.iconProvider + " is not a valid icon provider for " + client.name);
	}
	li.append(icon);
	auth_list.append(li); // this is appended here and not at L21 because if it was at L21, L47 would only append to auth_list and not to link
	link.append(li.cloneNode(true));
	// add text
	link.firstElementChild.append(document.createTextNode("Sign in with " + client.name));
	li.append(document.createTextNode(" " + client.name));
});

router.get("/", (req, res) => {
	if (!req.query.url) {
		return res.redirect("https://auth.onedot.cf/about");
	}
	res.render(__dirname + "/index.html", {
		url: encodeURIComponent(req.query.url),
		buttons: auth_buttons.outerHTML.replace(/{{url}}/g, encodeURIComponent(req.query.url)),
	});
});
router.get("/googleb9551735479dd7b0.html", (req, res) => {
	res.sendFile(__dirname + "/googleb9551735479dd7b0.html");
});
router.get("/robots.txt", (req, res) => {
	res.sendFile(__dirname + "/robots.txt");
});
// css
router.get("/bundle.css", (_, res) => {
	res.sendFile(__dirname + "/bundle.css");
});
router.get("/bundle-beta.css", (_, res) => {
	text = fs.readFileSync(__dirname + "/bundle-beta.css", "utf-8");
	res.setHeader("content-type", "text/css");
	res.send(minify.minify(text).styles);
});

// about
router.get("/about", (_, res) => {
	res.render(__dirname + "/about.html", {
		clients: auth_list.outerHTML,
	});
});

//logo
router.get("/logo.svg", (_, res) => {
	res.sendFile(__dirname + "/1Auth NoPad.svg");
});
router.get("/favicon.ico", (_, res) => {
	res.redirect("https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg");
});

// error
router.get("/error", (_, res) => {
	res.render(__dirname + "/error.html");
});

// old
router.get("/old", (_, res) => {
	res.render(__dirname + "/old.html");
});

module.exports = router;
