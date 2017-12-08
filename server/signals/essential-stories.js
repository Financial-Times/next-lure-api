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
	const storiesHaveRelativeUrl = allStories.filter(story => story.type !== 'non-article');

	if (storiesHaveRelativeUrl.length < q1Length) {
		return null;
	}

	response.ribbon = Object.assign({
		items: storiesHaveRelativeUrl.slice(0, q1Length)
			.map(item => {
				item.originator = 'essential-stories';
				return item;
			})
	}, model);

	return response;

};
