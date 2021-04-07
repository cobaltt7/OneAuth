const CleanCSS = require("clean-css");
var minify = new CleanCSS();
const zlib = require("zlib");

const fs = require("fs");
var router = require("express").Router();
router.get("/", (req, res) => {
	if (!req.query.url) {
		return res.redirect("https://auth.onedot.cf/about");
	}
	res.render(__dirname + "/index.html", {
		url: encodeURIComponent(req.query.url),
	});
});
// css
router.get("/bundle.css", (_, res) => {
	res.sendFile(__dirname + "/bundle.css");
});
router.get("/bundle-beta.css", (_, res) => {
	// it was already minifed
	res.writeHead(200, {
		"Content-Encoding": "gzip", // setting the encoding to gzip
	});
	text = fs.readFileSync(__dirname + "/bundle-beta.css", "utf-8");

	// Create a Gzip Transform Stream
	const gzip = zlib.createGzip();

	const interval = setInterval(() => {
		// Write a space character to the stream
		gzip.write(" ");

		// From Node.js docs: Calling .flush() on a compression stream will
		// make zlib return as much output as currently possible.
		gzip.flush();
	}, 1000);

	setTimeout(() => {
		gzip.write(minify.minify(text).styles);
		clearInterval(interval);
		gzip.end();
	}, 5500);

	// Pipe the Gzip Transform Stream into the Response stream
	gzip.pipe(res);
});

// about
router.get("/about", (_, res) => {
	res.render(__dirname + "/about.html");
});

//logo
router.get("/logo.svg", (_, res) => {
	res.sendFile(__dirname + "/1Auth NoPad.svg");
});
router.get("/favicon.ico", (_, res) => {
	res.redirect("https://cdn.onedot.cf/brand/SVG/Transparent/Auth.svg");
});

// error
router.get("/error", (_, res) => {
	res.render(__dirname + "/error.html");
});

// old
router.get("/old", (_, res) => {
	res.render(__dirname + "/old.html");
});
router.use((_, res) => {
	res.status(404).sendFile(__dirname + '/404.html');
});
module.exports = router;
