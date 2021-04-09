module.exports = {
	theme: {
		extend: {
			colors: {
				inherit: "inherit",
			},
		},
	},
	purge: ["./views/**.html", "./routes/main/**.html", "./tailwind.css"],
	darkMode: "class",
	plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
	mode: "jit",
};
