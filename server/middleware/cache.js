module.exports = (req, res, next) => {
	res.set('Cache-Control', res.FT_NO_CACHE);
	res.set('Surrogate-Control', res.FT_HOUR_CACHE);
	next();
};
