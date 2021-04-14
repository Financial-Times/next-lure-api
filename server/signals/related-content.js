const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getBrandRelatedConcepts = require('../lib/get-brand-related-concepts');
const getRelatedContent = require('../lib/get-related-content');
const {RIBBON_COUNT, ONWARD_COUNT, ALTERNATE_ONWARD_COUNT} = require('../constants');

module.exports = async (content, {locals: {slots}}) => {
	const mostRelatedConcepts = getMostRelatedConcepts(content);
	const brandRelatedConcepts = getBrandRelatedConcepts(content);

	if (!mostRelatedConcepts || !brandRelatedConcepts) {
		return {};
	}

	const related = await getRelatedContent(mostRelatedConcepts[0], ONWARD_COUNT, content.id, null);
	const brandRelated = await getRelatedContent(brandRelatedConcepts[0], ALTERNATE_ONWARD_COUNT, content.id, null);

	const response = {};

	if (!related.items.length) {
		return response;
	}
	if (slots.ribbon) {
		response.ribbon = {
			concept: related.concept,
			items: related.items.slice(0, RIBBON_COUNT)
		};
	}

	if (slots.onward) {
		response.onward = {
			concept: related.concept,
			items: related.items.slice(0, ONWARD_COUNT)
		};
	}

	if (slots.alternateOnward) {
		response.alternateOnward = {
			concept: brandRelated.concept,
			items: brandRelated.items.slice(0, ALTERNATE_ONWARD_COUNT)
		};
	}

	return response;
};
