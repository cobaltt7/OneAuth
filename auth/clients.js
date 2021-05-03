"use strict";

/*
 * TODO: move comment to wiki
 *
 * name: Name of the client
 * link: Absoolute URI that users are directed to when they click the button. {{url}} will be replaced with the uri-encoded url to be redirected to. Each client is responsible for storring it in some way.
 * icon: Icon of the client. Should be the name of
 * 	a SVG file in the routes/svg directory (without the .svg extention),
 * 	the name of a FontAwesome icon,
 * 	or an absolute url
 * iconProvider: Determines which of the above the icon is. Should be one of svg, url, or fa
 * pages: Array of objects. Each object can have these properties:
 * 	post: Function that runs on a HTTP POST request to backendPage. Takes three arguments:
 * 		req: Express request object
 * 		res: Express response object
 * 		sendResponse: Function that takes three arguments:
 * 			tokenOrData: Token returned by the client that can be passed to the getData function. Alternatively this can be the user's data (see rawData).
 * 			url: URI to redirect to afterwards. Should have come from {{url}} in link.
 * 			res: Express response object
 * 	get: Function that runs on a HTTP GET request to backendPage. Takes the same three arguments as post.
 * 	backendPage: Page that handles the said HTTP requests. Relative to <HOSTNAME>/auth/
 * getData: Function that outputs a users' data based on a token. Takes one argument:
 * 	token: token passed to pages.post.sendResponse via tokenOrData
 * rawData: boolean that determines if instead of passing a token to sendResponse, you will send the users' data directly. ONLY USE IF ALL THE DATA YOU RE SENDING CAN BE VIEWED BY ANYONE ANYWHERE ANYTIME
 */
module.exports = [
	{
		getData: async (token) => {
			const atob = require("atob"),
				fetch = require("node-fetch"),
				{
					// jshint camelcase:false
					id_token: idToken = ".eyJlcnJvciI6InRvbyBzbG93In0=.",
					// jshint camelcase:true
				} = await fetch("https://oauth2.googleapis.com/token", {
					body: `code=${token}&client_id=808400069481-nfa73dlrelv8rmtibnenjsdk4n0aj32r.apps.googleusercontent.com&client_secret=I8Wr-B-Ykt4Kmo4dmg5LLgm9&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle&grant_type=authorization_code`,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
				}).then((res) => res.json());

			const info = JSON.parse(atob(idToken.split(".")[1])),
				returnVal = {};
			for (const item in info) {
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
						"error",
					].includes(item)
				) {
					returnVal[`${item}`] = info[item];
				}
			}
			return returnVal;
		},
		icon: "google",
		iconProvider: "svg",
		link:
			"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=808400069481-nfa73dlrelv8rmtibnenjsdk4n0aj32r.apps.googleusercontent.com&scope=openid%20email%20profile&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle&state={{url}}&nonce={{nonce}}",
		name: "Google",
		pages: [
			{
				backendPage: "google",
				get: (req, res, sendResponse) => {
					sendResponse(req.query.code, req.query.state, res);
				},
			},
		],
	},
	{
		icon: "https://repl.it/public/images/logo.svg",
		iconProvider: "url",
		link: "/auth/replit?url={{url}}",
		name: "Replit",
		pages: [
			{
				backendPage: "replit",
				get: (req, res, sendResponse) => {
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
					return res.render(`${__dirname}/html/replit.html`);
				},
			},
		],
		rawData: true,
	},
	{
		icon: "envelope",
		iconProvider: "fas",
		link: "/auth/email?url={{url}}",
		name: "Email",
		pages: [
			{
				backendPage: "email",
				get: (_, res) => {
					res.render(`${__dirname}/html/email.html`);
				},
				post: async (req, res, sendResponse) => {
					const database = new (require("@replit/database"))();
					console.log(req.body);
					if (req.body.code && req.body.email) {
						const { email = null, date = null } =
							(await database.get(`EMAIL_${req.body.code}`)) || {};
						if (Date.now() - date > 900000) {
							await database.delete(`EMAIL_${req.body.code}`);
							return res
								.status(410)
								.render("/home/runner/auth/routes/main/error.html");
						}
						if (req.body.email !== email) {
							return res
								.status(401)
								.render("/home/runner/auth/routes/main/error.html");
						}
						await database.delete(`EMAIL_${req.body.code}`);
						return sendResponse(
							{
								email,
							},
							req,
							res,
						);
					}
					if (req.body.email && !req.body.code) {
						// Send email
						const Mail = require("nodemailer").createTransport({
								auth: {
									pass: process.env.GMAIL_PASS,
									user: process.env.GMAIL_EMAIL,
								},
								service: "gmail",
							}),
							code = require("retronid").generate();
						await database.set(`EMAIL_${code}`, {
							date: Date.now(),
							email: req.body.email,
						});
						res.status(201);

						Mail.sendMail(
							{
								from: process.env.GMAIL_EMAIL,
								// TODO: move email to it's own file
								html: `<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
	</head>
	<body style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;;">
		<img src="https://auth.onedot.cf/logo.svg" alt="1Auth logo" style="max-width: 550px;">
		<div style="font-size: 1.3em;">
			<h1>1Auth Email Verification</h1>
			<h2>Your code is ${code}. <u>Don't share it with anyone else.</u></h2>
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
</html>`,
								subject: "1Auth Email Verification",
								text: `1Auth Email Verification
Your code is ${code}. Don't share it with anyone else.

What now?
->	Copy your code
->	Go back to 1Auth
->	Paste it in the box
->	You are now logged in!
Doesn't work? Maybe it's been too long. Try starting over!

Not expecting this email? Just ignore it. Don't worry, nothing will happen.`,
								// eslint-disable-next-line id-length
								to: req.body.email,
							},
							(error, info) => {
								if (error) {
									console.error(error);
									return res
										.status(500)
										.render("/home/runner/auth/routes/main/error.html");
								}
								return res.json(info);
							},
						);
					}
					return res.status(400);
				},
			},
		],
	},
	{
		icon: "github",
		iconProvider: "fa",
		link:
			"https://github.com/login/oauth/authorize?client_id=Iv1.1database69635c026c31d&redirect_uri=https://auth.onedot.cf/backend/github&state={{url}}",
		name: "GitHub",

		// To be migrated
		pages: [{ backendPage: "github" }],
	},
	{
		icon: "https://repl.it/public/images/logo.svg",
		iconProvider: "url",
		link:
			"https://scratchcommentauth.onedotprojects.repl.co?url=https://auth.onedot.cf/backend/scratch%3Furl={{url}}",
		name: "Scratch",

		// This uses the old backend page (/backend/scratch) (to be moved)
	},
];
