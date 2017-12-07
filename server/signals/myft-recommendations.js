const fetchres = require('fetchres');
const slimQuery = query => encodeURIComponent(query.replace(/\s+/g, ' ')); // condense multiple spaces to one
const { extractArticlesFromConcepts, doesUserFollowConcepts } = require('../lib/transform-myft-data');

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

module.exports = async (content, {locals: {slots, userId, q2Length}}) => {

	if (!userId || !slots.onward) {
		return null;
	}
	const variables = { uuid: userId };
	const url = `https://next-api.ft.com/v2/query?query=${slimQuery(query)}&variables=${JSON.stringify(variables)}&source=next-front-page-myft`;

	return fetch(url, { headers: {'X-Api-Key': process.env.NEXT_API_KEY }, timeout: 5000 })
		.then(fetchres.json)
		.then(({ data: {user: {followed = []}}} = {}) => followed )
		.then(doesUserFollowConcepts)
		.then(extractArticlesFromConcepts)
		.then(async ({ articles } = {}) => {

			if (!articles || articles.length < q2Length) {
				return null;
			}

			const response = {};
			response.onward = { items: articles.slice(0, q2Length) };

			return response;

		})
		.catch(() => {
			return null;
		});

};
