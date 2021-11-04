const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getBrandConcept = require('../lib/get-brand-concept');
const getRelatedContent = require('../lib/get-related-content');
const {Count, ContentSelection, TestVariant} = require('../constants');
const { canShowBottomSlotOnPage, canShowRibbonOnPage } = require('../lib/can-show-on-page');
const dedupe = require('../lib/dedupe');

async function relatedContent (content, {locals: {flags = {}, slots}}) {
	const count = Math.max(Count.RIBBON, Count.ONWARD, Count.ONWARD2);
	let topic;
	let brand;

	const relatedConcepts = getMostRelatedConcepts(content) || [];
	const topicConcept = relatedConcepts[0];

	if (!canShowRibbonOnPage(content)) {
		slots.ribbon = false;
	}

	if (flags.hideTopRibbon) {
		slots.ribbon = false;
	}

	if (!canShowBottomSlotOnPage(content)) {
		slots.onward = false;
		slots.onward2 = false;
	}

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
			if (slots.ribbon) {
				ribbon = brand;
				onward = topic;
				onward2 = brand;
				contentSelection.ribbon = contentSelection.onward2 = ContentSelection.BRAND;
				contentSelection.onward = ContentSelection.TOPIC;
			} else {
				onward = brand;
				onward2 = topic;
				contentSelection.onward = ContentSelection.BRAND;
				contentSelection.onward2 = ContentSelection.TOPIC;
			}
		} else if (flags.onwardJourneyTests === TestVariant.Variant2) {
			ribbon = topic;
			onward = topic;
			onward2 = brand;
			contentSelection.ribbon = contentSelection.onward = ContentSelection.TOPIC;
			contentSelection.onward2 = ContentSelection.BRAND;
		} else {
			ribbon = topic;
			onward = topic;
			contentSelection.ribbon = contentSelection.onward = ContentSelection.TOPIC;
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

	if (!canShowRibbonOnPage(content)) {
		delete response.ribbon;
	}

	if (!canShowBottomSlotOnPage(content)) {
		delete response.onward;
		delete response.onward2;
	}

	// Dedupe & trim each list...

	if (response.ribbon) {
		// Ribbon is not considered when deduping
		response.ribbon.items = response.ribbon.items.slice(0, Count.RIBBON);
	}

	if (response.onward && response.onward2) {
		if (flags.onwardJourneyTests === TestVariant.Variant2) {
			// Dedupe strategy:
			// Simply remove elements from the second list (onward2)
			// if they appear in the first list (onward).
			// We don't use the advaned strategy which may, in some cases, remove
			// elements from the first list if they appear in a more favourable position
			// in the seond list. This is because the current test onward2
			const [a, b] = dedupe.simple(
				item => item.id,
				response.onward.items.slice(0, Count.ONWARD + 4 /* +4 to add an extra row of results */),
				response.onward2.items
			);
			response.onward.items = a;
			//Trim onward2 AFTER removing duplicates.
			response.onward2.items = b.slice(0, Count.ONWARD2);
		} else {
			const frameSize = 4;
			// Dedupe strategy:
			// Remove duplicate elements from either list depending where they appear in the list.
			// eg If a duplicate item's index in A=5 and B=0, then remove it from list A.
			// This is to avoid favouring a duplicate that is unlikely to be displayed on the front-end
			const [a, b] = dedupe.advanced(
				item => item.id,
				response.onward.items.slice(0, Count.ONWARD),
				response.onward2.items,
				frameSize,
			);
			response.onward.items = a;
			//Trim onward2 AFTER removing duplicates.
			response.onward2.items = b.slice(0, Count.ONWARD2);
		}
	} else if (response.onward) {
		response.onward.items = response.onward.items.slice(0, Count.ONWARD);
	} else if (response.onward2) {
		response.onward2.items = response.onward2.items.slice(0, Count.ONWARD2);
	}

	return response;
}

module.exports = relatedContent;
