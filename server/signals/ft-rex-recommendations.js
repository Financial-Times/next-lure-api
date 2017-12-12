const fetchres = require('fetchres');
const es = require('@financial-times/n-es-client');
const TEASER_PROPS = require('@financial-times/n-teaser').esQuery;

module.exports = async (content, {locals: {slots, q2Length}}) => {

	if (!slots.onward) {
		return null;
	}

	const url = `http://ft-rex.herokuapp.com/roar?article_id=${content.id}`;

	return fetch(url, { timeout: 5000 })
		.then(fetchres.json)
		.then(async articleIds => {

			if (articleIds.length < q2Length) {
				return null;
			}

			const options = articleIds.map(id => ({ _id: id, _source: TEASER_PROPS }));
			const articles = await es.mget({ docs: options });

			if (!articles || articles.length < q2Length) {
				return null;
			}

			const response = {};
			const model = {
				title: 'ft rex recommendations', //TODO set proper title
				titleHref: '/'
			};

			const items = articles.slice(0, q2Length);
			items.forEach(item => item.originator = 'ft-rex-recommendations');

			response.onward = Object.assign({
				items: items
			}, model);

			return response;

		})
		.catch(() => {
			return null;
		});

};
