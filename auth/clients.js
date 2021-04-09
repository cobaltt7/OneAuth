/*
	name: name of the client
	link: link that you are directed to on client selection
	icon: icon of client, should be a name of a svg file or fontawesome icon or a url
	iconProvider: determines if icon is a fontawesome or svg icon, should be url, fa, or svg
	post: function that runs on a post request to backendPage
	get: function that runs on a get request to backendPage
	backendPage: page that handles everything
*/
module.exports = [
	{
		name: "Google",
		link: "/auth/google?url={{url}}",
		icon: "google",
		iconProvider: "svg",
		backendPage: "/auth/google",
	},
	{
		name: "Replit",
		link: "/auth/replit?url={{url}}",
		icon: "https://repl.it/public/images/logo.svg",
		iconProvider: "url",
		backendPage: "/auth/replit",
	},
	{
		name: "Email",
		link: "/auth/email?url={{url}}",
		icon: "envelope",
		iconProvider: "fas",
		backendPage: "/auth/email",
	},
	{
		name: "GitHub",
		link: "https://github.com/login/oauth/authorize?client_id=Iv1.1db69635c026c31d&redirect_uri=https://auth.onedot.cf/auth/github&state=https%3A%2F%2Fgoogle.com",
		icon: "github",
		iconProvider: "fa",
		backendPage: "/auth/github",
	},
];
