const { STATUS_CODES } = require('http');

function errorHandler (error, request, response, next) {
	const statusCode = Number.parseInt(error.statusCode || error.status || 500, 10);

	if (!response.headersSent) {
		response.status(statusCode);
		if (statusCode === 404) {
			response.set('Cache-Control', response.FT_NO_CACHE);
			response.set('Surrogate-Control', response.FT_SHORT_CACHE);
		}
	}

	response.send(STATUS_CODES[statusCode] || `Unknown error ${statusCode}`);
	response.end();
	next(error);
}

module.exports = errorHandler;
