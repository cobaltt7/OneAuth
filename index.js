// SET UP EXPRESS
const app = require("express")(); // Initialize server
//express config
app.set("views", "./views");
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
		return res.render(__dirname + "/routes/main/old.html");
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
const nodemailer = require("nodemailer"); // email
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
					res.status(500).json({
						ok: 0,
						message: err.message,
					}),
				);
		})
		.catch((err) =>
			res.status(500).json({
				ok: 0,
				message: err.message,
			}),
		);
});
// replit
app.get("/backend/repl", (req, res) => {
	if (req.get("X-Replit-User-Id")) {
		const data = {
			userid: req.get("X-Replit-User-Id"),
			username: req.get("X-Replit-User-Name"),
			userroles: req.get("X-Replit-User-Roles"),
			url: req.query.url,
		};
		sendResponse(data, req, res);
	} else {
		res.render(__dirname + "/views/repl.html");
	}
});
// email
app.get("/backend/email", (_, res) => {
	res.render(__dirname + "/views/email.html");
});
app.post("/backend/email", async (req, res) => {
	if (req.body.code && req.body.email) {
		const { email = null, date = null } = (await db.get("EMAIL_" + req.body.code)) || {};
		if (email === null || date === null || Date.now() - date > 900000) {
			res.json({
				ok: 0,
			});
			return db.delete("EMAIL_" + req.body.code);
		}
		if (req.body.email !== email) {
			res.json({
				ok: 0,
			});
			return;
		}
		db.delete("EMAIL_" + req.body.code);
		const data = {
			email: email,
		};
		sendResponse(data, req, res);
		return;
	}
	res.json({
		ok: 0,
	});
	if (req.body.email && !req.body.code) {
		// send email
		const Mail = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.GMAIL_EMAIL,
				pass: process.env.GMAIL_PASS,
			},
		});
		const id = retronid();
		await db.set("EMAIL_" + id, {
			email: req.body.email,
			date: Date.now(),
		});

		Mail.sendMail(
			{
				from: process.env.GMAIL_EMAIL,
				to: req.body.email,
				subject: "1Auth Email Verification",
				html: `<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1">
					</head>
					<body style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;;">
						<img src="/logo.svg" alt="1Auth logo" style="max-width: 550px;">
						<div style="font-size: 1.3em;">
							<h1>1Auth Email Verification</h1>
							<h2>Your code is ${id}. <u>Don't share it with anyone else.</u></h2>
							<h3>What now?</h3>
							<ul>
								<li>Copy your code</li>
								<li>Go back to 1Auth</li>
								<li>Paste it in the box</li>
								<li>You are now logged in!</li>
							</ul>
							<p>Doesn't work? Maybe it's been too long. Try starting over!</p>
						</div>
						<b style="font-size: 1.1em;">
							<i>Not expecting this email? Just ignore it. Don't worry, nothing will happen.</i>
						</b>
					</body>
				</html>`, // this is the html version
				text: `1Auth Email Verification
Your code is ${id}. Don't share it with anyone else.

What now?
->	Copy your code
->	Go back to 1Auth
->	Paste it in the box
->	You are now logged in!
Doesn't work? Maybe it's been too long. Try starting over!

Not expecting this email? Just ignore it. Don't worry, nothing will happen.`, // this is the text version
			},
			function (error) {
				if (error) {
					return res.status(500).json({
						ok: 0,
						message: error,
					});
				}
				return;
			},
		);
	}
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
			return res.json({
				ok: 0,
			});
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
	res.status(404).sendFile(__dirname + "/routes/main/404.html");
});
console.log("404 page ready");

// LISTEN
app.listen(3000, () => console.log("App ready"));
