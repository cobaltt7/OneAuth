const CleanCSS = require('clean-css')
var minify = new CleanCSS()
const fs = require('fs')
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
  text = fs.readFileSync(__dirname + "/bundle-beta.css","utf-8");
  res.setHeader('content-type', 'text/css');

	res.send(minify.minify(text).styles);
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
module.exports = router;
