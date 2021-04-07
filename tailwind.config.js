module.exports = {
	purge: ["./views/**.html", "./routes/main/**.html", "./tailwind.css"],
	theme: {
		// ...
	},
	darkMode: "media",
	plugins: [require("@tailwindcss/forms")],
};
