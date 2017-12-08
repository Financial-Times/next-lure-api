module.exports = (content, {locals: {slots, q1Length}}) => {

	if (!slots.ribbon) {
		return null;
	}

	const response = {};
	const model = {
		title: 'Essential stories related to this article',
		titleHref: '/'
	};

	let allStories = [];

	content._editorialComponents.forEach(component => {
		allStories = allStories.concat(component.stories);
	})

	//avoid stories doesn't have relativeUrl to set n-teaser
	const storiesHasRelativeUrl = allStories.map(story => story.type !== 'non-article' ? story : false )
		.filter(story => !!story);

	if (storiesHasRelativeUrl.length < q1Length) {
		return null;
	}

	response.ribbon = Object.assign({
		items: storiesHasRelativeUrl.slice(0, q1Length)
			.map(item => {
				item.originator = 'essential-stories';
				return item;
			})
	}, model);

	return response;

};
