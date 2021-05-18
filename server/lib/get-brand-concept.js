const conceptIds = require('@financial-times/n-concept-ids');
const { Predicate, ConceptType, findNewsletterBrand } = require('./content');
const scoredSort = require('./scored-sort');

module.exports = sortAnnotations;

const Priority = {
	HIGH: 4,
	MEDIUM: 2,
	LOW: 1,
	NEGATIVE: -1,
};

module.exports.priorityList = new Map([
	// Brands that are Editorially important AND have a high likelyhood of being
	// in competition with other prioritsed brands (i.e. also in the list below) when scoring.
	// These should not always win, but only win some of the time.
	[conceptIds.brand.climateCapital, Priority.HIGH],

	// other prioritsed brands
	[conceptIds.brand.etfHub, Priority.MEDIUM],
	[conceptIds.brand.htsi, Priority.MEDIUM],
	[conceptIds.brand.magazine, Priority.MEDIUM],
	[conceptIds.brand.globetrotter, Priority.MEDIUM],
	[conceptIds.brand.moralMoney, Priority.LOW],

	// Weighted Down:
	// The Special Reports brand has many sub-brands. When one of the sub-brands
	// is in use we'd favour it over the broader/generic Special Reports brand
	[conceptIds.brand.specialReport, -1],
]);

// A list of non-brand concepts (mainly genres) that a user might
// want to continue reading more of.
module.exports.fallbackConcepts = [
	conceptIds.genre.letter,
	conceptIds.genre.obituary,
	conceptIds.genre.recipe,
];

function getPriorityByConceptId (id) {
	if (module.exports.priorityList.has(id)) {
		return (module.exports.priorityList.get(id) || 0) + 1;
	}
	return 0;
}

const sortBrandsByScore = scoredSort(({predicate, id, directType}) => {
	if (directType === ConceptType.Brand) {
		const priority = getPriorityByConceptId(id);
		const weight = predicate === Predicate.isClassifiedBy ? 2 : 1;
		return Math.max(priority * weight + weight, weight);
	}
	if (module.exports.fallbackConcepts.includes(id)) {
		return 1;
	}
}, 1);

function sortAnnotations (content) {
	if (!content.annotations) {
		return undefined;
	}

	const newsletter = findNewsletterBrand(content);

	if (newsletter) {
		return newsletter;
	}

	return sortBrandsByScore(content.annotations)[0];
}
