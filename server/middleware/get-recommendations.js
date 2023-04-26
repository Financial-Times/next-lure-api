const logger = require('@financial-times/n-logger').default;

const relatedContent = require('../signals/related-content');

module.exports = async (req, res, next) => {
	try {
		res.locals.recommendations = await relatedContent(res.locals.content, { locals: Object.assign({}, res.locals) });
		next();
	} catch (err) {
		logger.error({event: 'RECOMMENDATION_FAILURE', contentId: req.params.contentId}, err);

		if (err.httpStatus) {
			return res.status(err.httpStatus).json({ message: err.message }).end();
		}

		if (/(network|response) timeout at: https:\/\/search-next-elasticsearch/.test(err.message)) {
			return res.status(504).end();
		}
		next(err);
	}
};
