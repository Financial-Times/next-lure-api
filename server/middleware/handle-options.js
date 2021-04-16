const { metrics } = require('@financial-times/n-express');

module.exports = (req, res, next) => {
	res.locals.slots = req.query.slots ? req.query.slots.split(',')
		.reduce((map, key) => {
			map[key] = true;
			return map;
		}, {}) : {'ribbon': true, 'onward': true};

	res.locals.edition = ['uk', 'international'].includes(req.get('ft-edition')) ? req.get('ft-edition') : undefined;
	res.locals.userId = req.query.userId;
	res.locals.secureSessionToken = req.get('FT-Session-s-Token') || req.cookies.FTSession_s;
	res.locals.teaserFormat = req.query.format ? req.query.format : 'n';

	next();

	try {
		metrics.count(`params.edition.${res.locals.edition}`);
		metrics.count(`params.teaserFormat.${res.locals.teaserFormat}`);
		Boolean(res.locals.userId) && metrics.count('params.userId');
		Boolean(res.locals.secureSessionToken) && metrics.count('params.secureSessionToken');
	} catch (error) {
		// swallow error
	}
};
