const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getBrandConcept = require('../lib/get-brand-concept');
const getRelatedContent = require('../lib/get-related-content');
const {RIBBON_COUNT, ONWARD_COUNT, BRAND_ONWARD_COUNT} = require('../constants');

module.exports = async (content, {locals: {flags, slots}}) => {
	const mostRelatedConcepts = getMostRelatedConcepts(content);
	const topicConcept = mostRelatedConcepts[0];
	const brandConcept = getBrandConcept(content);

	if (!mostRelatedConcepts) {
		return {};
	}

	const related = await getRelatedContent(topicConcept, brandConcept, ONWARD_COUNT, content.id, null, flags);

	const brandRibbon = (flags.lureBrandOnwardSlot && flags.lureBrandOnwardSlot === 'brandRibbon');

	const response = {};

	if (!related.topicItems.length) {
		return response;
	}

	if (brandRibbon && !related.brandItems.length) {
		return response;
	}

	if (slots.ribbon) {
		response.ribbon = {
			// If the lureBrandOnwardSlot is set to the brandRibbon variant, populate the ribbon with recent content
			// from the brand, rather than from the topic.
			concept: brandRibbon ? related.brandConcept : related.topicConcept,
			items: brandRibbon ? related.brandItems.slice(0, RIBBON_COUNT) : related.topicItems.slice(0, RIBBON_COUNT)
		};
	}

	if (slots.onward) {
		response.onward = {
			concept: related.topicConcept,
			items: related.topicItems.slice(0, ONWARD_COUNT)
		};
	}

	if (slots.brandOnward && !!brandConcept) {
		response.brandOnward = {
			concept: related.brandConcept,
			items: related.brandItems.slice(0, BRAND_ONWARD_COUNT)
		};
	}

	return response;
};
