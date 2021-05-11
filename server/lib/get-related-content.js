const es = require('@financial-times/n-es-client');
const logger = require('@financial-times/n-logger').default;

const getTrackablePredicate = concept => {
	const predicate = concept.predicate.split('/').pop();
	const type = concept.directType.split('/').pop().toLowerCase();

	if (predicate === 'about' || predicate === 'isPrimarilyClassifiedBy') {
		return predicate;
	}

	return `${predicate}-${type}`;
};

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
			const originator = getTrackablePredicate(concept);
			return {
				concept,
				items: items
					.filter(item => item.id !== parentContentId)
					.map(item => {
						item.originator = originator;
						item.isPremium = item.accessLevel === 'premium'; // elasticsearch -> next-api field mapping
						return item;
					})
			};
		});
};
