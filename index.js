// SET UP EXPRESS
const app = require("express")(); // Initialize server
//express config
app.set("view engine", "html");

app.disable("view cache");
console.log("Express ready");
// mustache
const mustacheExpress = require("mustache-express");
app.engine("html", mustacheExpress(__dirname + "/routes/main/partials", ".html"));

// cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser());
// compress
var compression = require("compression");
app.use(compression());
// post request bodies
const bodyParser = require("body-parser");
app.use(
	bodyParser.urlencoded({
		extended: true,
	}),
);
app.use(
	bodyParser.urlencoded({
		extended: false,
	}),
);
// old browsers
app.use(function (req, res, next) {
	if (req.url.indexOf(".css") >= 0 || req.url.indexOf(".js") >= 0) return next();
	if (
		req.get("User-Agent").indexOf("MSIE") >= 0 ||
		req.get("User-Agent").indexOf("Trident") >= 0 ||
		req.get("User-Agent").indexOf("Netscape") >= 0 ||
		req.get("User-Agent").indexOf("Navigator") >= 0
	) {
		return res.status(400).render(__dirname + "/routes/main/old.html");
	}
	return next();
});

console.log("Express plugins ready");
// static-ish pages
app.use("/", require("./routes/main/main.js"));
console.log("Main pages ready");
// auth pages
app.use("/", require("./auth/auth.js"));

// OTHER SETUP
require("dotenv").config();
const retronid = require("retronid").generate;
const db = new (require("@replit/database"))();

// AUTH STUFF

var base64 = require("base-64"); // scratch
const axios = require("axios"); // github, scratch
// github
app.get("/backend/github", (req, res) => {
	axios
		.post(
			`https://github.com/login/oauth/access_token`,
			{
				client_id: "Iv1.1db69635c026c31d",
				client_secret: process.env.githubSECRET,
				code: req.query.code,
				state: req.query.state,
			},
			{
				headers: {
					accept: "application/json",
				},
			},
		)
		.then((res) => res.data.access_token)
		.then((token) => {
			axios({
				method: "get",
				url: `https://api.github.com/user`,
				headers: {
					Authorization: "token " + token,
				},
			})
				.then((response) => {
					sendResponse(response.data, req, res);
				})
				.catch((err) =>
					res.status(502)
				);
		})
		.catch((err) =>
			res.status(502)
		);
});
// scratch
app.get("/backend/scratch/", (req, res) => {
	if (req.query.verified) {
		sendResponse({ username: req.query.username }, req, res);
	}
});
app.get("/backend/scratch/http:/:url", (req, res) => {
	axios({
		method: "get",
		url: `https://fluffyscratch.hampton.pw/auth/verify/v2/${req.query.privateCode}`,
	}).then((response) => {
		const data = response.data;
		if (data.valid) {
			req.query.url = `http://${req.params.url}`;
			sendResponse(data, req, res);
		} else {
			return res.status(502)
		}
	});
});
app.get("/backend/scratchredirect", (req, res) => {
	res.redirect(
		`https://scratchcommentauth.onedotprojects.repl.co/?url=https://auth.onedot.cf/backend/scratch?url=${req.query.url}`,
	);
});
console.log("Auth pages ready");

// 404 PAGE
app.use((_, res) => {
	res.status(404).render(__dirname + "/routes/main/404.html");
});
console.log("404 page ready");

// LISTEN
app.listen(3000, () => console.log("App ready"));
