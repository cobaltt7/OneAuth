module.exports = (app) => {
	const realGet=app.get
	app.get = (url, callback) => {
		realGet(url, (req, res, next) => {
			res.bodySent=false;
			callback(req, res, next);
			if (!res.bodySent && (res.statusCode < 300 || res.statusCode > 399))
				next();
		});
	};
};
