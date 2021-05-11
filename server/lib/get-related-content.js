const es = require('@financial-times/n-es-client');
const logger = require('@financial-times/n-logger').default;

module.exports = (
	concept,
	count,
	parentContentId,
) => {
	const props = ['id', 'teaser.*'];

	return es.search({
		_source: props,
		query: {
			term: {
				'annotations.id': concept.id,
			},
		},
		size: count * 2, // fetch too many in case duplicates are removed
	}, 500)
		.catch(err => {
			logger.error(err);
			return [];
		})
		.then(items => {
			return {
				concept,
				items: items
					.filter(item => item.id !== parentContentId)
			};
		});
};
