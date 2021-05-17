"use strict";

const path = require("path"),
	// eslint-disable-next-line new-cap
	router = require("express").Router();

router.get("/error", (_, res) => {
	res.status(500).render(path.resolve(__dirname, "error.html"));
});

router.get("/old", (req, res) => {
	res.status(400).render(path.resolve(__dirname, "old.html"), {
		all: req.msgs.errorOldAll,
	});
});

router.use((_, res) => {
	res.on("finish", () => {
		const code = res.statusCode || 404;
		console.log(code);
	});
});

module.exports = router;
