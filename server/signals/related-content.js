const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getRelatedContent = require('../lib/get-related-content');
const {RIBBON_COUNT, ONWARD_COUNT} = require('../constants');

module.exports = async (content, {locals: {slots}}) => {
	const concepts = getMostRelatedConcepts(content);

	if (!concepts) {
		return {};
	}

	const related = await getRelatedContent(concepts[0], ONWARD_COUNT, content.id, null);

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

	return response;
};
