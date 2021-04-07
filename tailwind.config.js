module.exports = {
	purge: ["./views/**.html", "./routes/main/**.html", "./tailwind.css"],
	theme: {
		textColor: {
			inherit: "inherit",
		},
	},
	darkMode: "media",
	plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
	mode: "jit",
};
