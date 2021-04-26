module.exports = res => {
	res.set('Cache-Control', res.FT_NO_CACHE);
	res.set('Surrogate-Control', res.FT_SHORT_CACHE);
	return res.status(404).end();
};
