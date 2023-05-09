const logger = require('@financial-times/n-logger').default;

const validKeys = new Set((process.env.LURE_API_READ_ONLY_KEYS || '').trim().split(/\s*,\s*/g).filter(Boolean));

if (!validKeys.size) {
	logger.error({event: 'EMPTY_LURE_API_READ_ONLY_KEYS', message: 'LURE_API_READ_ONLY_KEYS env var has no valid API keys'});
}

process.env.INTERNAL_SMOKE_TEST_KEY && validKeys.add(process.env.INTERNAL_SMOKE_TEST_KEY);

module.exports = async (req, res, next) => {
	const apiKey = req.get('X-API-KEY');
	const validApiKey = validKeys.has(apiKey);

	if (!apiKey || !validApiKey) {
		logger.error({
			event: !apiKey ? 'NO_API_KEY' : 'INVALID_API_KEY',
			body: req.body,
			method: req.method,
			headers: req.headers,
			url: req.originalUrl
		});

		return res.status(401).json({
			status: 401,
			message: 'Unauthorized: please supply a valid API key.'
		});
	}

	next();
};
