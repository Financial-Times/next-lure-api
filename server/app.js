const express = require('@financial-times/n-express');
const cookieParser = require('cookie-parser');
require('express-async-errors');
const healthchecks = require('./healthchecks');
const errorHandler = require('./middleware/error-handler');
const createErrorLogger = require('@dotcom-reliability-kit/middleware-log-errors');
const registerCrashHandler = require('@dotcom-reliability-kit/crash-handler');

registerCrashHandler();

const app = express({
	systemCode: 'next-lure-api',
	graphiteName: 'lure-api',
	withFlags: true,
	healthChecks: healthchecks.checks,
});
app.use(cookieParser());

app.get('/__gtg', (req, res) => res.sendStatus(200));

const lure = express.Router();
const v2 = express.Router();

const middleware = require('./middleware');

const middlewareStack = [
	middleware.handleOptions,
	middleware.getContent,
	middleware.getRecommendations,
	middleware.respond
];

v2.get('/content/:contentId', middlewareStack);
v2.use(errorHandler);

lure.use('/v2', v2);
app.use('/lure', lure);

app.use('/__lure', middleware.apiKeyAuth, lure);

app.use(createErrorLogger({
	filter: (error) => {
		const status = error.statusCode || error.status;
		return status !== 404;
	}
}));

if (process.env.NODE_ENV !== 'test') {
	healthchecks.init();
	app.listen(process.env.PORT || 3002);
}

module.exports = app;
