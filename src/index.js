/** @file Main Script that sets up Express and Express middleware. */

import path from "path";
import { fileURLToPath } from "url";

import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { urlencoded } from "express";
import mustacheExpress from "mustache-express";

import localization from "../lib/localization.js";
import auth from "./auth/index.js";
import documentation from "./docs/index.js";
import errors from "./errors/index.js";
import main from "./main/index.js";

import "isomorphic-fetch";

dotenv.config();

const app = express(),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	mustacheEngine = mustacheExpress(path.resolve(directory, "partials"), ".html");

app.disable("case sensitive routing");
app.engine("html", mustacheEngine);
app.engine("css", mustacheEngine);
app.enable("json escape");
app.disable("strict routing");
app.set("view cache", process.env.NODE_ENV === "production");

app.set("views", directory);
app.disable("x-powered-by");

app.use(compression());
app.use(
	express.static(path.resolve(directory, "static"), {
		dotfiles: "allow",
		immutable: true,
		maxAge: 31536000,
	}),
);

app.use((request, response, next) => {
	// Default: 4 weeks
	let directive = "public, max-age=2419200000";

	// No cache on development server
	if (process.env.NODE_ENV !== "production") directive = "no-store, max-age=0";
	// 2 weeks
	else if (request.path.includes(".css")) directive = "public, max-age=1209600000";
	// 6 weeks
	else if (request.path.includes(".")) directive = "public, max-age=3628800000, immutable";
	// No cache
	else if (request.path.includes("/auth")) directive = "no-store, max-age=0";

	response.setHeader("Cache-Control", directive);

	return next();
});

// Information parsing

// Not exculded on assets because of localization.
app.use(cookieParser());

const bodyParser = urlencoded({
	extended: true,
});

app.use((request, response, next) =>
	request.path.includes(".") ? next() : bodyParser(request, response, next),
);

// Pages
app.use(localization);
app.use(errors);
app.use("/docs", documentation);
app.use(main);
app.use(auth);

app.use((_, response) => response.status(404));

// LISTEN
// eslint-disable-next-line no-console -- We need to know when it's ready.
app.listen(process.env.PORT || 3000, () => console.log("App ready"));
