const conceptIds = require('@financial-times/n-concept-ids');
const { Predicate, ConceptType, withType, findNewsletterBrand } = require('./content');
const scoredSort = require('./scored-sort');

module.exports = sortAnnotations;

const priorityList = new Map([
	// Brands that Editorially important and have a high likelyhood of being
	// in competition with other brands when scoring.
	[conceptIds.brand.climateCapital, 2],

	// other weighted brands
	[conceptIds.brand.etfHub, 1],
	[conceptIds.brand.htsi, 1],
	[conceptIds.brand.magazine, 1],
	[conceptIds.brand.globetrotter, 1],
	[conceptIds.brand.moralMoney],

	// Weighted Down:
	// The Special Reports brand has many sub-brands. When one of the sub-brands
	// is in use we'd favour it over the broader/generic Special Reports brand
	[conceptIds.brand.specialReport, -1],
]);

const sortBrandsByScore = scoredSort([
	({predicate}) => Predicate.isClassifiedBy === predicate && 1.5,
	({id}) => priorityList.has(id) && (priorityList.get(id) || 0) + 1,
]);

function sortAnnotations (content) {
	if (!content.annotations) {
		return undefined;
	}

	const brands = content.annotations.filter(withType(ConceptType.Brand));

	if (brands.length <= 1) {
		return brands[0];
	}

	const newsletter = findNewsletterBrand(content);

	if (newsletter) {
		return newsletter;
	}

	return sortBrandsByScore(brands)[0];
}
