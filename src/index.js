"use strict";

// SET UP EXPRESS

const express = require("express");
const app = express();
app.disable("view cache");
console.log("Express ready");

// Mustache

app.engine("html", require("mustache-express")(`${__dirname}/routes/partials`, ".html"));
app.set("views", __dirname);
app.set("view engine", "html");

// Cookies

app.use(require("cookie-parser")());

// Compress

app.use(require("compression")());

// L10N

app.use(require("./l10n.js").setLangFromRequest);

// Post request bodies

app.use(
	express.urlencoded({
		extended: true,
	}),
);
app.use(
	express.urlencoded({
		extended: false,
	}),
);

// Old browsers

app.use((req, res, next) => {
	if (req.url.indexOf(".css") >= 0 || req.url.indexOf(".js") >= 0) {
		return next();
	}
	if (
		req.get("User-Agent").indexOf("MSIE") >= 0 ||
		req.get("User-Agent").indexOf("Trident") >= 0 ||
		req.get("User-Agent").indexOf("Netscape") >= 0 ||
		req.get("User-Agent").indexOf("Navigator") >= 0
	) {
		return res.status(400).render(`${__dirname}/routes/errors/old.html`);
	}
	return next();
});

// Main pages

app.use(require("./routes/main/index.js"));
console.log("Main pages ready");

// Auth pages

app.use(require("./routes/auth/index.js"));
console.log("Auth pages ready");

// Errors

app.use(require("./routes/errors/index.js"));
console.log("Error pages ready");

// LISTEN

app.listen(3000, () => console.log("App ready"));
