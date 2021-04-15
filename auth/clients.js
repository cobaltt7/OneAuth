/*
	name: name of the client
	link: link that users are directed to when they click the button. Relative to https://auth.onedot.cf
	icon: icon of client, should be the name of a SVG file, the name of a FontAwesome icon or an absolute url
	iconProvider: determines which of the above the icon is. Should be one of url, fa, or svg
	pages: array of objects. each object can have these properties:
		post: function that runs on a post request to backendPage. Takes three arguments: req and res
		get: function that runs on a get request to backendPage. Takes three arguments: req and res
		backendPage: Page that handles the said GET and POST requests. Relative to https://auth.onedot.cf/auth/
*/
module.exports = [
	{
		name: "Google",
		link:
			"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=808400069481-nfa73dlrelv8rmtibnenjsdk4n0aj32r.apps.googleusercontent.com&scope=openid%20email%20profile&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle&state={{url}}&nonce=hellojrnfdignrtigrig",
		icon: "google",
		iconProvider: "svg",
		pages: [
			{
				backendPage: "google",
				get: async (req, res, sendResponse) => {
					const fetch = require("node-fetch");
					const atob = require("atob");
					const info = await fetch("https://oauth2.googleapis.com/token", {
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},
						method: "POST",
						body: `code=${req.query.code}&client_id=808400069481-nfa73dlrelv8rmtibnenjsdk4n0aj32r.apps.googleusercontent.com&client_secret=I8Wr-B-Ykt4Kmo4dmg5LLgm9&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle&grant_type=authorization_code`,
					})
						.then((res) => res.json())
						.then(({ id_token = ".eyJlcnJvciI6InRvbyBzbG93In0=." }) =>
							JSON.parse(atob(id_token.split(".")[1])),
						);
					if (info.error) {
						return res.status(500).render("/home/runner/auth/routes/main/error.html");
					}
					returnVal = {};
					for (a in info) {
						if (
							[
								"sub",
								"email",
								"email_verified",
								"family_name",
								"given_name",
								"locale",
								"name",
								"picture",
								"profile",
							].includes(a)
						)
							returnVal[a] = info[a];
					}
					console.log(returnVal);
					sendResponse(returnVal, req.query.state, res);
				},
			},
		],
	},
	{
		name: "Replit",
		link: "/auth/replit?url={{url}}",
		icon: "https://repl.it/public/images/logo.svg",
		iconProvider: "url",
		pages: [
			{
				backendPage: "replit",
				get: async (req, res, sendResponse) => {
					if (req.get("X-Replit-User-Id")) {
						return sendResponse(
							{
								"X-Replit-User-Id": req.headers["X-Replit-User-Id"],
								"X-Replit-User-Name": req.headers["X-Replit-User-Name"],
								"X-Replit-User-Roles": req.headers["X-Replit-User-Roles"],
							},
							req.query.url,
							res,
						);
					}
					res.render(__dirname + "/html/replit.html");
				},
			},
		],
	},
	{
		name: "Email",
		link: "/auth/email?url={{url}}",
		icon: "envelope",
		iconProvider: "fas",
		pages: [
			{
				backendPage: "email",
				get: (req, res) => {
					res.render(__dirname + "/html/email.html");
				},
				post: async (req, res, sendResponse) => {
					const db = new (require("@replit/database"))();
					if (req.body.code && req.body.email) {
						const { email = null, date = null } = (await db.get("EMAIL_" + req.body.code)) || {};
						if (Date.now() - date > 900000) {
							await db.delete("EMAIL_" + req.body.code);
							return res.status(410).render("/home/runner/auth/routes/main/error.html");
						}
						if (req.body.email !== email) {
							return res.status(401).render("/home/runner/auth/routes/main/error.html");
						}
						await db.delete("EMAIL_" + req.body.code);
						return sendResponse(
							{
								email: email,
							},
							req,
							res,
						);
					}
					if (req.body.email && !req.body.code) {
						// send email
						const Mail = require("nodemailer").createTransport({
							service: "gmail",
							auth: {
								user: process.env.GMAIL_EMAIL,
								pass: process.env.GMAIL_PASS,
							},
						});
						const id = require("retronid").generate();
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
		<img src="https://auth.onedot.cf/logo.svg" alt="1Auth logo" style="max-width: 550px;">
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
							(error) => {
								console.error(error);
								return res.status(500).render("/home/runner/auth/routes/main/error.html");
							},
						);
						return res.status(200);
					}
					return res.status(400);
				},
			},
		],
	},
	{
		name: "GitHub",
		link:
			"https://github.com/login/oauth/authorize?client_id=Iv1.1db69635c026c31d&redirect_uri=https://auth.onedot.cf/auth/github&state=https%3A%2F%2Fgoogle.com",
		icon: "github",
		iconProvider: "fa",
		pages: [{ backendPage: "github" }],
	},
];
