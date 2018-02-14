const es = require('@financial-times/n-es-client');
const send404 = require('../lib/send-404');

module.exports = async (req, res, next) => {
	try {
		res.locals.content = await es.get(req.params.contentId, {}, 500);
		next();
	} catch (err) {
		if (err.status === 404) {
			return send404(res);
		}
		throw err;
	}
};
