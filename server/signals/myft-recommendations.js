const fetch = require('node-fetch');
const fetchres = require('fetchres');
const getMostRelatedConcepts = require('../lib/get-most-related-concepts');
const getRelatedContent = require('../lib/get-related-content');
const slimQuery = query => encodeURIComponent(query.replace(/\s+/g, ' ')); // condense multiple spaces to one
const extractArticlesFromConcepts = require('../lib/transform-myft-data');
const doesUserFollowConcepts = (followedConcepts) => {
	return {
		followsConcepts: Boolean(followedConcepts.length),
		followedConcepts
	};
};

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

	const variables = { uuid: userId };
	const url = `https://next-api.ft.com/v2/query?query=${slimQuery(query)}&variables=${JSON.stringify(variables)}&source=next-front-page-myft`;

	return fetch(url, { headers: {'X-Api-Key': process.env.NEXT_API_KEY }, timeout: 5000 })
		.then(fetchres.json)
		.then(({ data: {user: {followed = []}}} = {}) => followed)
		.then(doesUserFollowConcepts)
		.then(extractArticlesFromConcepts)
		.then(async ({ articles } = {}) => {

			if (!articles) {
				return null;
			}

			const response = {};
			const model = {
				title: 'More from myFT', //TODO set proper title
				titleHref: `/myft/${userId}`
			};

			response.ribbon = Object.assign({
				items: articles.slice(0, q1Length)
			}, model);

			if (slots.onward) {
				const concepts = getMostRelatedConcepts(content);
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
