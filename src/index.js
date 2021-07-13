/** @file Main Script that sets up Express and Express middleware. */

import path from "path";
import { fileURLToPath } from "url";

import compression from "compression";
import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import mustacheExpress from "mustache-express";

import auth from "./auth/index.js";
import documentation from "./docs/index.js";
import { errorPages, old } from "./errors/index.js";
import localization from "./l10n.js";
import main from "./main/index.js";

const app = express(),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	mustacheEngine = mustacheExpress(path.resolve(directory, "partials"), ".html");

app.engine("html", mustacheEngine);
app.engine("css", mustacheEngine);

app.use(compression());

app.use(errorPages);

app.use((request, response, next) => {
	if (request.path.includes(".css")) response.setHeader("Cache-Control", "public, max-age=86400");
	else if (request.path.includes("."))
		response.setHeader("Cache-Control", "public, max-age=31536000");

	return next();
});

app.use(old);

// Information parsing
const bodyParser = urlencoded({
	extended: true,
});

app.use((request, response, next) => {
	if (request.path.includes(".")) return next();

	return cookieParser()(request, response, next);
});
app.use((request, response, next) => {
	if (request.path.includes(".")) return next();

	return bodyParser(request, response, next);
});

// Pages
app.use(localization);
app.use("/docs", documentation);
app.use(main);
app.use("/auth", auth);

app.use((_, response) => response.status(404));

// LISTEN
// eslint-disable-next-line no-console -- We need to know when it's ready.
app.listen(3000, () => console.log("App ready"));
