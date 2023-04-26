const logger = require('@financial-times/n-logger').default;

function validApiKey (apiKey) {
	// All keys are treated as valid in test environments
	if (process.env.NODE_ENV === 'test') {
		return true;
	}

	// Permit access if its the correct API KEY
	if (process.env.LURE_API_READ_ONLY_KEY === apiKey) {
		return true;
	}

	// If no matches, deny access
	return false;
}

module.exports = async (req, res, next) => {
	if (!validApiKey(req.get('X-API-KEY'))) {
		logger.error({
			event: 'NO_API_KEY',
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
