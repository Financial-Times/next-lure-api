const { metrics } = require('@financial-times/n-express');

module.exports = (req, res, next) => {
	res.locals.slots = req.query.slots ? req.query.slots.split(',')
		.reduce((map, key) => {
			map[key] = true;
			return map;
		}, {}) : {'ribbon': true, 'onward': true};

	res.locals.userId = req.query.userId;
	res.locals.secureSessionToken = req.get('FT-Session-s-Token') || req.cookies.FTSession_s;

	next();

	try {
		Boolean(res.locals.userId) && metrics.count('params.userId');
		Boolean(res.locals.secureSessionToken) && metrics.count('params.secureSessionToken');
	} catch (error) {
		// swallow error
	}
};
