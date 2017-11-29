const express = require('@financial-times/n-express');

const topStoriesPoller = require('./data-sources/top-stories-poller');
topStoriesPoller.init();

const healthchecks = require('./healthchecks');
healthchecks.init();

const app = express({
	systemCode: 'next-lure-api',
	withFlags: true,
	healthChecks: healthchecks.checks
});

app.get('/__gtg', (req, res) => res.sendStatus(200));

const lure = express.Router();
const v1 = express.Router();
const v2 = express.Router();

const middleware = require('./middleware');

const middlewareStack = [
	middleware.handleOptions,
	middleware.constructQueryLengths,
	middleware.cache,
	middleware.getContent,
	middleware.getRecommendations,
	middleware.respond
];

v1.get('/content/:contentId', (req, res, next) => {
	res.locals.modelTemplate = {
		rhr: 5,
		onward: [3, 3],
		listName: 'recommendations'
	};
	next();
}, middlewareStack);

v2.get('/content/:contentId', (req, res, next) => {
	res.locals.modelTemplate = {
		listName: 'items',
		ribbon: 5
	};
	res.locals.modelTemplate.onward = res.locals.flags.cleanOnwardJourney ? 8 : [3, 3];
	next();
}, middlewareStack);

lure.use('/v1', v1);
lure.use('/v2', v2);
app.use('/lure', lure);

if (process.env.NODE_ENV !== 'test') {
	app.listen(process.env.PORT || 3002);
}

module.exports = app;
