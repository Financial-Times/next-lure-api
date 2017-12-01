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

	if (allStories.length < q1Length) {
		return null;
	}

	response.ribbon = Object.assign({
		items: allStories.slice(0, q1Length)
	}, model);

	return response;

};
