const es = require('@financial-times/n-es-client');
const { metrics } = require('@financial-times/n-express');

module.exports = async (req, res, next) => {
	try {
		res.locals.content = await es.get(
			req.params.contentId,
			{
				_source: [
					'id',
					'annotations',
					'displayConcept',
					'publishedDate',
					'topper',
					'containedIn',
				],
			},
			500
		);
		metrics.count('content.es.success');
		next();
	} catch (err) {
		if (err.status === 404) {
			metrics.count('content.es.notfound');
			throw err;
		}

		metrics.count('content.es.fail');
		throw err;
	}
};
