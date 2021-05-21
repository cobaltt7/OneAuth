/** @file Shows Error pages when errors occur. */

const path = require("path"),
	// eslint-disable-next-line new-cap
	router = require("express").Router();

router.get("/error", (_, res) => {
	res.status(500).render(path.resolve(__dirname, "error.html"));
});

router.get("/old", (req, res) => {
	res.status(400).render(path.resolve(__dirname, "old.html"), {
		all: req.messages.errorOldAll,
	});
});

router.use((_, res) => {
	const code = res.statusCode === 200 ? 404 : res.statusCode;
	console.log(code);
});

module.exports = [
	(app) => {
		const realGet = app.get;
		app.get = (url, callback) => {
			realGet(url, (req, res, next) => {
				res.bodySent = false;
				callback(req, res, next);
				if (
					!res.bodySent &&
					(res.statusCode < 300 || res.statusCode > 399)
				)
					next();
			});
		};
	},
	router,
];
