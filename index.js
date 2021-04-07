// SET UP EXPRESS
const app = require("express")(); // Initialize server
const mustacheExpress = require("mustache-express");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.engine("html", mustacheExpress());
app.set("views", "./views");
app.set("view engine", "html");
app.disable("view cache");
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
app.use(function (req, res, next) {
	// disalow old browsers
	if (req.url.indexOf(".css") >= 0 || req.url.indexOf(".js") >= 0) return next();
	if (
		req.get("User-Agent").indexOf("MSIE") >= 0 ||
		req.get("User-Agent").indexOf("Trident") >= 0 ||
		req.get("User-Agent").indexOf("Netscape") >= 0 ||
		req.get("User-Agent").indexOf("Navigator") >= 0
	) {
		return res.render(__dirname + "/routes/old/old.html");
	}
	return next();
});
app.use("/", require("./routes/main/main.js")); // static-ish pages

// OTHER SETUP
require("dotenv").config();
const retronid = require("retronid").generate;
const db = new (require("@replit/database"))();

// AUTH STUFF
const { document } = new (require("jsdom").JSDOM)("").window;
const auth_clients = require("./auth/clients.js");

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
		class: "auth-buttons",
	});

	// add the icon
	let icon;
	if (client.iconProvider === "fa") {
		icon = Object.assign(document.createElement("i"), {
			className: "fas fa-" + client.icon,
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
	auth_list.append(li); // this is appended here and not at L61 because if it was at L61, L81 would only append to auth_list and not to link
	link.append(li.cloneNode(true));
	// add text
	link.firstElementChild.append(document.createTextNode("Sign in with " + client.name));
	li.append(document.createTextNode(client.name));

	// save
	console.log(auth_buttons.outerHTML);
	console.log(auth_list.outerHTML);
});

var base64 = require("base-64"); // scratch
const nodemailer = require("nodemailer"); // email
const axios = require("axios"); // github, scratch
const { OAuth2Client } = require("google-auth-library"); // google
const client = new OAuth2Client(process.env.googleAppUrl); // google

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
	verify(req.params.token).catch((e) => {
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
app.get("/backend/scratch/https:/:url", (req, res) => {
	axios({
		method: "get",
		url: `https://fluffyscratch.hampton.pw/auth/verify/v2/${req.query.privateCode}`,
	}).then((response) => {
		const data = response.data;
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
	}).then((response) => {
		const data = response.data;
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

// HANDLE DATA
const sendResponse = async function (data, req, res) {
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
};
app.get("/backend/get_data/:code", async (req, res) => {
	// client is retriving data
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	if (!req.params.code) {
		return res.status(400).send("Missing code");
	}
	res.json(await db.get("RETRIEVE_" + req.params.code));
	await db.delete("RETRIEVE_" + req.params.code);
});
app.get("/backend/remove_data/:code", async (req, res) => {
	// user denies sharing data
	if (!req.params.code) {
		return res.status(400).send("Missing code");
	}
	res.json(await db.set("RETRIEVE_" + req.params.code), { error: "Denied access" });
});

// LISTEN
app.listen(3000);
