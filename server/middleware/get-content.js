const es = require('@financial-times/n-es-client');
const { metrics } = require('@financial-times/n-express');
const send404 = require('../lib/send-404');

module.exports = async (req, res, next) => {
	try {
		res.locals.content = await es.get(req.params.contentId, {}, 500);
		metrics.count('content.es.success');
		next();
	} catch (err) {
		if (err.status === 404) {
			metrics.count('content.es.notfound');
			return send404(res);
		}
		metrics.count('content.es.fail');
		throw err;
	}
};
