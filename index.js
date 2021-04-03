const app = require("express")();
const mustacheExpress = require("mustache-express");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
require("dotenv").config();
const retronid = require("retronid").generate;
const axios = require("axios");
const Database = require("@replit/database");
const db = new Database();
app.use(cookieParser());
app.engine("html", mustacheExpress());
app.set("views", "./views");
app.set("view engine", "html");
app.disable("view cache");
var base64 = require("base-64");

// google auth id token setup
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.googleAppUrl);
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
app.use(function(req, res, next) {
	if (req.url.indexOf(".css") >= 0 || req.url.indexOf(".js") >= 0) return next();
	if (
		req.get("User-Agent").indexOf("MSIE") >= 0 ||
		req.get("User-Agent").indexOf("Trident") >= 0 ||
		req.get("User-Agent").indexOf("Netscape") >= 0 ||
		req.get("User-Agent").indexOf("Navigator") >= 0
	) {
		return res.sendFile(__dirname + "/views/old.html");
	}
	return next();
});
app.get("/old", (_, res) => {
	res.sendFile(__dirname + "/views/old.html");
});
async function sendResponse(data, req, res) {
	const url = req.query.url || req.query.state;
	const retro = retronid();
	await db.set("RETRIEVE_" + retro, data);
	try {
		const host = new URL(url).host;
		res.render(__dirname + "/views/allow.html", {
			url: url,
			host: host,
			data: `${data}`,
			code: retro,
			paramJoiner: url.indexOf("?") > -1 ? "&" : "?",
		});
	} catch (e) {
		return res.status(400).send("Error:<br> " + e);
	}
}
// tailwind css
app.get("/bundle.css", (_, res) => {
	res.sendFile(__dirname + "/bundle.css");
});

//logo
app.get("/logo.png", (_, res) => {
	res.redirect("https://cdn.onedot.cf/brand/PNG%20No%20BG/Auth.png");
});
app.get("/favicon.ico", (_, res) => {
	res.redirect("https://cdn.onedot.cf/brand/PNG%20No%20BG/Auth.png");
});
// main page
app.get("/", (req, res) => {
	res.render(__dirname + "/views/index.html", {
		url: encodeURIComponent(req.query.url),
	});
});
// google
app.get("/backend/google/:token", (req, res) => {
	async function verify(idtoken) {
		const ticket = await client.verifyIdToken({
			idToken: idtoken,
			audience: process.env.googleAppUrl,
		});
		var PAYLOAD = ticket.getPayload();
		sendResponse(PAYLOAD, req, res);
	}
	verify(req.params.token).catch(e => {
		console.error(e);
		res.json({
			ok: 0,
		});
	});
});
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
		.then(res => res.data.access_token)
		.then(token => {
			axios({
				method: "get",
				url: `https://api.github.com/user`,
				headers: {
					Authorization: "token " + token,
				},
			})
				.then(response => {
					sendResponse(response.data, req, res);
				})
				.catch(err =>
					res.status(500).json({
						ok: 0,
						message: err.message,
					}),
				);
		})
		.catch(err =>
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
		res.sendFile(__dirname + "/views/repl.html");
	}
});
// email
app.get("/backend/email", (_, res) => {
	res.sendFile(__dirname + "/views/email.html");
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
		const transporter = nodemailer.createTransport({
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

		transporter.sendMail(
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
						<img src="https://cdn.onedot.cf/brand/SVG%20No%20BG/1%20AUTH.svg" alt="1 Auth logo" style="max-width: 550px;">
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
			function(error) {
				if (error) {
					return res.status(500).json({
						ok: 0,
						message: error,
					});
				}
			},
		);
		return;
	}
});
// scratch
app.get("/backend/scratch/https:/:url", (req, res) => {
	axios({
		method: "get",
		url: `https://fluffyscratch.hampton.pw/auth/verify/v2/${req.query.privateCode}`,
	}).then(response => {
		const data = response.data;
		console.log(data);
		if (data.valid) {
			req.query.url = `https://${req.params.url}`;
			sendResponse(data, req, res);
		} else {
			return res.json({
				ok: 0,
			});
		}
	});
});
app.get("/backend/scratch/http:/:url", (req, res) => {
	axios({
		method: "get",
		url: `https://fluffyscratch.hampton.pw/auth/verify/v2/${req.query.privateCode}`,
	}).then(response => {
		const data = response.data;
		console.log(data);
		if (data.valid) {
			req.query.url = `https://${req.params.url}`;
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
		`https://fluffyscratch.hampton.pw/auth/getKeys/v2?redirect=${base64.encode(
			`auth.onedot.cf/backend/scratch/${req.query.url}/`,
		)}`,
	);
});
app.post("/backend/get_data", async (req, res) => {
	if (!req.body.code) {
		res.status(400).send("Missing code");
	}
	res.json(await db.get("RETRIEVE_" + req.body.code));
	await db.delete("RETRIEVE_" + req.body.code);
});
app.post("/backend/remove_data", async (req, res) => {
	if (!req.body.code) {
		res.status(400).send("Missing code");
	}
	res.json(await db.set("RETRIEVE_" + req.body.code), { error: "Denied access" });
});
// listen on port 8080, but we could do any port
app.listen(8080, () => {});
