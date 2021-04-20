const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getBrandConcept = require('../lib/get-brand-concept');
const getRelatedContent = require('../lib/get-related-content');
const {RIBBON_COUNT, ONWARD_COUNT, BRAND_ONWARD_COUNT} = require('../constants');

module.exports = async (content, {locals: {flags, slots}}) => {
	const mostRelatedConcepts = getMostRelatedConcepts(content);
	const brandConcept = getBrandConcept(content);

	if (!mostRelatedConcepts) {
		return {};
	}

	const related = await getRelatedContent(mostRelatedConcepts[0], ONWARD_COUNT, content.id, null);
	const brandRelated = await getRelatedContent(brandConcept, BRAND_ONWARD_COUNT, content.id, null);

	const brandRibbon = (flags.lureBrandOnwardSlot && flags.lureBrandOnwardSlot === 'brandRibbon');

	const response = {};

	if (!related.items.length) {
		return response;
	}

	if (slots.ribbon) {
		response.ribbon = {
			concept: brandRibbon ? brandRelated.concept : related.concept,
			items: brandRibbon ? brandRelated.items.slice(0, RIBBON_COUNT) : related.items.slice(0, RIBBON_COUNT)
		};
	}

	if (slots.onward) {
		response.onward = {
			concept: related.concept,
			items: related.items.slice(0, ONWARD_COUNT)
		};
	}

	if (slots.brandOnward && !!brandConcept) {
		response.brandOnward = {
			concept: brandRelated.concept,
			items: brandRelated.items.slice(0, BRAND_ONWARD_COUNT)
		};
	}

	return response;
};
