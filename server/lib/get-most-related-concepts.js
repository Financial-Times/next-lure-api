const { Predicate, ConceptType } = require('./content');
const scoredSort = require('./scored-sort');

module.exports = sortAnnotations;

const rankedPredicates = rank(
	Predicate.about,
	Predicate.isPrimarilyClassifiedBy,
	Predicate.implicitlyAbout,
	Predicate.isClassifiedBy,
);

const rankedTypes = rank(
	ConceptType.Organisation,
	ConceptType.Location,
	ConceptType.Topic,
	ConceptType.Brand,
);

const sortAnnotationsByScore = scoredSort([
	({predicate}) => Math.pow(rankedPredicates[predicate], 2),
	({directType}) => rankedTypes[directType],
], 2);

function sortAnnotations (content) {
	if (!content.annotations) {
		return undefined;
	}

	const sortedAnnotations = sortAnnotationsByScore(content.annotations);

	const displayTag = content.displayConcept && content.displayConcept.isDisplayTag ? content.displayConcept : null;

	if(displayTag) {
		sortedAnnotations.unshift(displayTag);
	}

	return sortedAnnotations.length ? sortedAnnotations : undefined;
}

// Create an object with a rank score for each element
// The first in the list has the highest score
// e.g rank('a', 'b', 'c', 'd') === {a: 4, b: 3, c: 2, d: 1}
function rank (...strings) {
	return strings
		// make a copy because .reverse() mutates the original array
		.slice(0)
		.reverse()
		.reduce((o, k, i) => {
			o[k] = (i + 1);
			return o;
		}, {});
}
