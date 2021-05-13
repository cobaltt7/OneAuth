"use strict";

// eslint-disable-next-line new-cap
const router = require("express").Router();
router.get("/error", (_, res) => {
	res.status(500).render(`${__dirname}/error.html`);
});
router.get("/old", (_, res) => {
	res.status(400).render(`${__dirname}/old.html`);
});
router.use((_, res) => {
	res.on("finish", () => {
		const code = res.statusCode || 404;
		console.log(code);
	});
});

module.exports = router;
