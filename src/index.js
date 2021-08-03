/** @file Main Script that sets up Express and Express middleware. */

import path from "path";
import { fileURLToPath } from "url";

import compression from "compression";
import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import mustacheExpress from "mustache-express";

import localization from "../lib/localization.js";
import auth from "./auth/index.js";
import documentation from "./docs/index.js";
import errorPages from "./errors/index.js";
import main from "./main/index.js";

const app = express(),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	mustacheEngine = mustacheExpress(path.resolve(directory, "partials"), ".html");

app.engine("html", mustacheEngine);
app.engine("css", mustacheEngine);
app.set("views", "/");

app.use(
	express.static(path.resolve(directory, "static"), {
		dotfiles: "allow",
		immutable: true,
		maxAge: 31536000,
	}),
);
app.use(compression());

app.use((request, response, next) => {
	let directive;

	if (request.path.includes(".css")) directive = "public, max-age=86400";
	else if (request.path.includes(".")) directive = "public, max-age=31536000, immutable";
	else if (request.path.includes("/auth")) directive = "no-store, max-age=0";
	else directive = "";

	if (directive) response.setHeader("Cache-Control", directive);

	return next();
});

// Information parsing
const bodyParser = urlencoded({
	extended: true,
});

// Not exculded on assets because of localization.
app.use(cookieParser());
app.use((request, response, next) => {
	if (request.path.includes(".")) return next();

	return bodyParser(request, response, next);
});

// Pages
app.use(localization);
app.use(errorPages);
app.use("/docs", documentation);
app.use(main);
app.use("/auth", auth);

app.use((_, response) => response.status(404));

// LISTEN
// eslint-disable-next-line no-console -- We need to know when it's ready.
app.listen(process.env.PORT || 3000, () => console.log("App ready"));
