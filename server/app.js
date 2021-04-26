const express = require('@financial-times/n-express');
const cookieParser = require('cookie-parser');

const healthchecks = require('./healthchecks');

const app = express({
	systemCode: 'next-lure-api',
	graphiteName: 'lure-api',
	withFlags: true,
	healthChecks: healthchecks.checks
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

lure.use('/v2', v2);
app.use('/lure', lure);

if (process.env.NODE_ENV !== 'test') {
	healthchecks.init();
	app.listen(process.env.PORT || 3002);
}

module.exports = app;
