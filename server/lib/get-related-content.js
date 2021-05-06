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
	topicConcept,
	brandConcept,
	count,
	parentContentId,
	flags,
) => {
	const props = ['id', 'teaser.*'];
	const searchObjects = [{
		_source: props,
		query: {
			term: {
				'annotations.id': topicConcept.id,
			},
		},
		size: count + 1,
	}];

	if (brandConcept && !!flags.lureBrandOnwardSlot) {
		searchObjects.push({
			_source: props,
			query: {
				term: {
					'annotations.id': brandConcept.id,
				},
			},
			size: count + 1,
		});
	}

	return es.search(searchObjects[0], 500)
		.catch(err => {
			logger.error(err);
			return [];
		})
		.then(items => ({
			topicConcept,
			topicItems: items
				.filter(item => item.id !== parentContentId)
				.map(item => {
					item.originator = getTrackablePredicate(topicConcept);
					item.isPremium = item.accessLevel === 'premium'; // elasticsearch -> next-api field mapping
					return item;
				})
				.slice(0, count),
			brandConcept,
			brandItems: [],
		}));
};
