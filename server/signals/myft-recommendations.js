const fetchres = require('fetchres');
const getRelatedContent = require('../lib/get-related-content');
const slimQuery = query => encodeURIComponent(query.replace(/\s+/g, ' ')); // condense multiple spaces to one

const basicFragment = `
	fragment Basic on Concept {
		type: __typename
		id
		prefLabel
		name: prefLabel
		url
		directType
		latestContent(limit: 6) {
			id
			url
			title
			isPremium
			... on Article {
				isPodcast
			}
			mainImage {
				url
			}
		}
	}
`;

const query = `
	${basicFragment}
	query MyFT($uuid: String!) {
		popularConcepts(limit: 4, excludeTypes:["http://www.ft.com/ontology/Genre","http://www.ft.com/ontology/Section","http://www.ft.com/ontology/Location"]) {
			... Basic
		}
		user(uuid: $uuid) {
			followed(limit: 4) {
				... Basic
			}
		}
	}
`;

module.exports = async (content, {locals: {slots, userId, q1Length, q2Length}}) => {

	if (!userId) {
		return null;
	}

	const url = `https://next-api.ft.com/v2/query?query=${slimQuery(query)}&variables=${userId}&source=next-front-page-myft`;

	return fetch(url, { credentials: 'include', timeout: 5000 })
		.then(fetchres.json)
		.then(({ data } = {}) => data)
		.then(async data => {

			const response = {};
			response.ribbon = Object.assign({
				items: data.slice(0, q1Length)
			}, topStoriesModel);

			if (slots.onward) {
				const secondaryOnward = await getRelatedContent(concepts[0], q2Length, content.id);
				response.onward = [
					Object.assign({}, response.ribbon),
					secondaryOnward
				];
			}
			return response;

		})
		.catch(() => {
			return null;
		});
};
