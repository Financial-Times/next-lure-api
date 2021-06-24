const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getBrandConcept = require('../lib/get-brand-concept');
const getRelatedContent = require('../lib/get-related-content');
const {Count, ContentSelection, TestVariant} = require('../constants');

async function relatedContent (content, {locals: {flags = {}, slots}}) {
	const count = Math.max(Count.RIBBON, Count.ONWARD, Count.ONWARD2);
	let topic;
	let brand;

	const relatedConcepts = getMostRelatedConcepts(content) || [];
	const topicConcept = relatedConcepts[0];

	if (topicConcept) {
		topic = getRelatedContent(topicConcept, count, content.id);
	}

	if (flags.onwardJourneyTests) {
		const brandConcept = getBrandConcept(content);
		// In some cases, such as for Podcast episodes, the displayConcept is set to be a Brand
		const isDuplicate = brandConcept && topicConcept && topicConcept.id === brandConcept.id;
		if (brandConcept && !isDuplicate) {
			brand = getRelatedContent(brandConcept, count, content.id);
		}
	}

	let ribbon;
	let onward;
	let onward2;
	let contentSelection = {};

	if (topic && !brand) {
		ribbon = topic;
		onward = topic;
		contentSelection.ribbon = contentSelection.onward = ContentSelection.TOPIC;
	} else if (!topic && brand) {
		ribbon = brand;
		onward = brand;
		contentSelection.ribbon = contentSelection.onward = ContentSelection.BRAND;
	} else if (topic && brand) {
		if (flags.onwardJourneyTests === TestVariant.Variant1) {
			ribbon = brand;
			onward = topic;
			onward2 = brand;
				contentSelection.ribbon = contentSelection.onward2 = ContentSelection.BRAND;
				contentSelection.onward = ContentSelection.TOPIC;
			onward = brand;
			onward2 = topic;
		} else if (flags.onwardJourneyTests === TestVariant.Variant2) {
		}
	}

	const response = {};

	async function slot (name, promise) {
		if (!slots[name] || !promise) {
			return;
		};
		const data = await promise;
		if (!data) return;
		if (!data.items) return;
		if (!data.items.length) return;
		response[name] = {
			// make a copy of the data to avoid mutating the object
			// later when change props and removing duplicate items
			concept: {
				...data.concept,
			},
			contentSelection: contentSelection[name],
			items: data.items.slice(0),
		};
	}

	await Promise.all([
		slot('ribbon', ribbon),
		slot('onward', onward),
		slot('onward2', onward2),
	]);

	// If the onward slot was requested but is empty
	// Then shift the onward2 data up into the onward slot, rather than being empty
	if (slots.onward && !response.onward && response.onward2) {
		response.onward = response.onward2;
		delete response.onward2;
	}

	// Dedupe & Trim
	if (response.ribbon) {
		// Ribbon is not considered when deduping
		response.ribbon.items = response.ribbon.items.slice(0, Count.RIBBON);
	}

	if (response.onward && response.onward2) {
		// Dedupe two adjacent components.
		response.onward.items = response.onward.items.slice(0, Count.ONWARD);
		const ids = new Set(response.onward.items.map(item => item.id));
		// Remove items from the second component. Trim after removing duplicates.
		response.onward2.items = response.onward2.items.filter((item) => !ids.has(item.id)).slice(0, Count.ONWARD2);
	} else if (response.onward) {
		response.onward.items = response.onward.items.slice(0, Count.ONWARD);
	} else if (response.onward2) {
		response.onward2.items = response.onward2.items.slice(0, Count.ONWARD2);
	}

	return response;
}

module.exports = relatedContent;
