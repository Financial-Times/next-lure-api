module.exports = (req, res, next) => {
	res.locals.slots = req.query.slots ? req.query.slots.split(',')
		.map(key => key === 'rhr' ? 'ribbon' : key)
		.reduce((map, key) => {
			map[key] = true;
			return map;
		}, {}) : {'ribbon': true, 'onward': true};

	res.locals.edition = ['uk', 'international'].includes(req.get('ft-edition')) ? req.get('ft-edition') : undefined;
	res.locals.userId = req.query.userId;

	next();
};
