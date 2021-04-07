/*
	name: name of the client
	link: link that you are directed to on client selection
	icon: icon of client, should be a name of a svg file or fontawesome icon
	iconProvider: determines wether icon is a fontawesome or svg icon, should be fa or svg
	post: function that runs on a post request to backendPage
	get: function that runs on a get request to backendPage
	backendPage: page that handles everything
*/
module.exports = [
	{
		name: "Google",
		link: "/auth/google.html?url={{url}}",
		icon: "google",
		iconProvider: "fa",
	},
];
