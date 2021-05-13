"use strict";

const path = require("path");

// eslint-disable-next-line new-cap
const router = require("express").Router();
router.get("/error", (_, res) => {
	res.status(500).render(path.resolve("error.html"));
});
router.get("/old", (_, res) => {
	res.status(400).render(path.resolve("old.html"));
});
router.use((_, res) => {
	res.on("finish", () => {
		const code = res.statusCode || 404;
		console.log(code);
	});
});

module.exports = router;
