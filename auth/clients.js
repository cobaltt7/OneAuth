/*
	name: name of the client
	link: link that users are directed to when they click the button. Relative to https://auth.onedot.cf
	icon: icon of client, should be the name of a SVG file, the name of a FontAwesome icon or an absolute url
	iconProvider: determines which of the above the icon is. Should be one of url, fa, or svg
	pages: array of objects. each object can have these properties:
		post: function that runs on a post request to backendPage. Takes two arguments: req and res
		get: function that runs on a get request to backendPage. Takes two arguments: req and res
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
				get: async (req, res) => {
					const fetch = require("node-fetch");
					const info = await fetch("https://oauth2.googleapis.com/token", {
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},
						method: "POST",
						body: `code=${req.query.code}&client_id=808400069481-nfa73dlrelv8rmtibnenjsdk4n0aj32r.apps.googleusercontent.com&client_secret=I8Wr-B-Ykt4Kmo4dmg5LLgm9&redirect_uri=https%3A%2F%2Fauth.onedot.cf%2Fauth%2Fgoogle&grant_type=authorization_code`,
					})
						.then((res) => res.json())
						.then(({ id_token: jwt }) => {
							const jwtBuffer = new Buffer(jwt);
							return Buffer.from(jwtBuffer, "base64").toString("ascii");
						});

					return res.json(info);
				},
			},
		],
	},
	{
		name: "Replit",
		link: "/auth/replit?url={{url}}",
		icon: "https://repl.it/public/images/logo.svg",
		iconProvider: "url",
		pages: [{ backendPage: "replit" }],
	},
	{
		name: "Email",
		link: "/auth/email?url={{url}}",
		icon: "envelope",
		iconProvider: "fas",
		pages: [{ backendPage: "email" }],
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
