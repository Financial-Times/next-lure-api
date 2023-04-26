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

	it('404 for no recommendations', async () => {
		return request(app)
			.get('/lure/v2/content/uuid')
			.expect(404);
	});

	it('404 for no recommendations', async () => {
		return request(app)
			.get('/__lure/v2/content/uuid')
			.expect(404);
	});

	it('sets appropriate cache headers for 404', async () => {
		return request(app)
			.get('/lure/v2/content/uuid')
			.expect('Cache-Control', 'max-age=0, no-cache, must-revalidate')
			.expect('Surrogate-Control', 'max-age=600, stale-while-revalidate=60, stale-if-error=86400');
	});

	it('sets appropriate cache headers for 404', async () => {
		return request(app)
			.get('/__lure/v2/content/uuid')
			.expect('Cache-Control', 'max-age=0, no-cache, must-revalidate')
			.expect('Surrogate-Control', 'max-age=600, stale-while-revalidate=60, stale-if-error=86400');
	});

	context('success', () => {

		before(() => rawData = {onward:{}});

		it('sets appropriate cache headers', async () => {
			return request(app)
				.get('/lure/v2/content/uuid')
				.expect('Cache-Control', 'max-age=0, no-cache, must-revalidate')
				.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400');
		});

		it('sets appropriate cache headers', async () => {
			return request(app)
				.get('/__lure/v2/content/uuid')
				.expect('Cache-Control', 'max-age=0, no-cache, must-revalidate')
				.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400');
		});

		it('converts concepts to headings and links', () => {
			rawData = {
				onward2: {
					items: getItems(5),
					concept: {
						prefLabel: 'Stuff',
						preposition: 'examplePrepos',
						relativeUrl: '/exampleLink'
					}
				},
			};

			return request(app)
				.get('/lure/v2/content/uuid')
				.then(({body}) => {
					expect(body.onward2.title).to.equal('More examplePrepos Stuff');
					expect(body.onward2.titleHref).to.equal('/exampleLink');
				});
		});

		it('converts concepts to headings and links', () => {
			rawData = {
				onward2: {
					items: getItems(5),
					concept: {
						prefLabel: 'Stuff',
						preposition: 'examplePrepos',
						relativeUrl: '/exampleLink'
					}
				},
			};

			return request(app)
				.get('/__lure/v2/content/uuid')
				.then(({body}) => {
					expect(body.onward2.title).to.equal('More examplePrepos Stuff');
					expect(body.onward2.titleHref).to.equal('/exampleLink');
				});
		});

		context('when fetching v2 style data', () => {
			before(() => {
				rawData = {
					onward: {
						items: getItems(7),
					}
				};
			});

			it('transforms v2 style data to v2', () => {
				return request(app)
					.get('/lure/v2/content/uuid')
					.then(({body}) => {
						expect(Array.isArray(body.onward)).to.be.false;
						expect(body.onward.items.length).to.equal(7);
						expect(uniqueIds('items', [body.onward])).to.be.true;
					});
			});

			it('transforms v2 style data to v2', () => {
				return request(app)
					.get('/__lure/v2/content/uuid')
					.then(({body}) => {
						expect(Array.isArray(body.onward)).to.be.false;
						expect(body.onward.items.length).to.equal(7);
						expect(uniqueIds('items', [body.onward])).to.be.true;
					});
			});
		});
	});
});
