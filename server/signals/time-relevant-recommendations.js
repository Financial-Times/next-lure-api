const topStoriesPoller = require('../data-sources/top-stories-poller');
const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getRelatedContent = require('../lib/get-related-content');
const dedupeById = require('../lib/dedupe-by-id');
const { NEWS_CONCEPT_ID } = require('../constants');

// get a slice of stories which excludes the current story, but also (to some degree)
// avoids looping through the same small number of stories
const topStoriesSlice = (stories, thisId) => {
	const thisStoryIndex = stories.indexOf(stories.find(teaser => teaser.id === thisId));
	let newStories;
	if (thisStoryIndex > -1) {
		// avoid cycling through the top few stories
		if (thisStoryIndex < 9) {
			newStories = stories.slice(thisStoryIndex + 1)
		} else {
			newStories = stories
				.filter(teaser => teaser.id !== thisId);
		}
	}
	return (newStories && newStories.length >= 5) ? newStories : stories.filter(teaser => teaser.id !== thisId);
}


module.exports = async (content, {locals: {edition, slots, q1Length, q2Length}, query: {localTimeHour}}) => {

	if (!(edition && localTimeHour)) {
		return
	}

	const response = {};

	const concepts = getMostRelatedConcepts(content);
	let topStories = topStoriesPoller.get(edition);

	let timeSlot;

	if (localTimeHour > 4 && localTimeHour < 12) {
		timeSlot = 'am';
	} else if (localTimeHour > 14 && localTimeHour < 20) {
		timeSlot = 'pm';
	} else {
		return;
	}

	const model = {
		title: timeSlot === 'am' ? 'Top stories this morning' : 'In-depth insight for the evening',
		titleHref: '/'
	};

	if (timeSlot === 'am') {
		topStories = topStories
			.filter(item => item.genreConcept && item.genreConcept.id === NEWS_CONCEPT_ID )
			.map(item => {
				return Object.assign({}, item, {originator: 'morning-reads'});
			});

	} else {
		topStories = topStories
			.concat(topStoriesPoller.get(`${edition}Opinion`))
			.filter(story => !!story)
			.filter(item => item.genreConcept && item.genreConcept.id !== NEWS_CONCEPT_ID)
			.map(item => {
				return Object.assign({}, item, {originator: 'evening-reads'});
			});

		topStories = dedupeById(topStories);
	}

	topStories = topStoriesSlice(topStories, content.id);

	const commonPart = Object.assign({
		items: topStories.slice(0, q1Length)
	}, model);

	if (slots.ribbon) {
		response.ribbon = commonPart;
	}

	if (slots.onward) {
		response.onward = [
			Object.assign({}, commonPart),
		];

		if (concepts && concepts[0]) {
			const secondaryOnward = await getRelatedContent(concepts[0], q2Length, content.id, timeSlot === 'am' ? true : false);
			response.onward.push(secondaryOnward)
		}
	}

	return response;

};
