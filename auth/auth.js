var router = require("express").Router();

const auth_clients = require("./clients.js");

const get_client = (client) => {
	for (c of auth_clients) {
		const r = c.pages.find(({ backendPage }) => backendPage === client);
		if (r) return r;
	}
};

router.get("/auth/:client", (req, res) => {
	let client = get_client(req.params.client);
	if (typeof client === "undefined") {
		return res.status(404).sendFile("/home/runner/auth/routes/main/404.html");
	}
	client.get(req, res);
});
router.post("/auth/:client", (req, res) => {
	let client = get_client(req.params.client);
	if (typeof client === "undefined") {
		return res.status(404).sendFile("/home/runner/auth/routes/main/404.html");
	}
	client.post(req, res);
});

module.exports = router;
