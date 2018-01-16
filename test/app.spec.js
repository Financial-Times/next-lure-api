const {expect} = require('chai');
const request = require('supertest-as-promised');
const sinon = require('sinon');
const middleware = require('../server/middleware');

const getItems = n => [...Array(n)].map((n, i) => ({id: i}));

const uniqueIds = (listName, [...arrays]) => {
	const set = new Set();
	arrays.forEach(obj => {
		obj[listName].forEach(({id}) => set.add(id));
	});
	return [...set].length === arrays.reduce((tot, obj) => tot + obj[listName].length, 0);
};

let rawData = {};
sinon.stub(middleware, 'getContent').callsFake((req, res, next) => next());
sinon.stub(middleware, 'getRecommendations').callsFake((req, res, next) => {
	res.locals.recommendations = rawData;
	next();
});
const app = require('../server/app');

describe('lure e2e', () => {
	after(() => {
		middleware.getContent.restore();
		middleware.getRecommendations.restore();
	});

	it('vary on flags and ft-edition header', () => {
		return request(app)
			.get('/lure/v2/content/uuid')
			.expect('Vary', 'ft-flags, ft-edition');
	});

	it('404 for no recommendations', async () => {
		return request(app)
			.get('/lure/v2/content/uuid')
			.expect(404);
	});

	it('sets appropriate cache headers for 404', async () => {
		return request(app)
			.get('/lure/v2/content/uuid')
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=600, stale-while-revalidate=60, stale-if-error=86400');
	});

	context('success', () => {

		before(() => rawData = {ribbon: {}});

		it('sets appropriate cache headers', async () => {
			return request(app)
				.get('/lure/v2/content/uuid')
				.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
				.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400');
		});

		it('converts concepts to headings and links', () => {
			rawData = {
				ribbon: {
					items: getItems(5),
					concept: {
						prefLabel: 'Stuff',
						preposition: 'apropos',
						relativeUrl: '/adskjasdk'
					}
				}
			};

			return request(app)
				.get('/lure/v2/content/uuid')
				.then(({body}) => {
					expect(body.ribbon.title).to.equal('Latest apropos Stuff');
					expect(body.ribbon.titleHref).to.equal('/adskjasdk');
				});
		});

		context('when fetching v2 style data', () => {
			before(() => {
				rawData = {
					ribbon: {
						items: getItems(4)
					},
					onward: {
						items: getItems(7),
					}
				};
			});

			it('transforms v2 style data to v2', () => {
				return request(app)
					.get('/lure/v2/content/uuid')
					.then(({body}) => {
						expect(body.ribbon.items.length).to.equal(4);
						expect(Array.isArray(body.onward)).to.be.false;
						expect(body.onward.items.length).to.equal(7);
						expect(uniqueIds('items', [body.onward])).to.be.true;
					});
			});
		});
	});
});
