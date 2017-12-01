const {expect} = require('chai');
const request = require('supertest-as-promised');
const sinon = require('sinon');
const middleware = require('../server/middleware');

const getItems = n => [...Array(n)].map((n, i) => ({id: i}))

const uniqueIds = (listName, [...arrays]) => {
	const set = new Set();
	arrays.forEach(obj => {
		obj[listName].forEach(({id}) => set.add(id))
	});
	return [...set].length === arrays.reduce((tot, obj) => tot + obj[listName].length, 0)
}

describe('lure e2e', () => {
	let app;
	let rawData = {};
	before(() => {
		sinon.stub(middleware, 'getContent').callsFake((req, res, next) => next());
		sinon.stub(middleware, 'getRecommendations').callsFake((req, res, next) => {
			res.locals.recommendations = rawData;
			next();
		});
		app = require('../server/app');

	});

	after(() => {
		middleware.getContent.restore();
		middleware.getRecommendations.restore();
	})

	it('vary on flags and ft-edition header', () => {
		return request(app)
			.get('/lure/v1/content/uuid')
			.expect('Vary', 'ft-flags, ft-edition')
	});

	it('404 for no recommendations', async () => {
		return request(app)
			.get('/lure/v1/content/uuid')
			.expect(404);
	});

	it('sets appropriate cache headers for 404', async () => {
		return request(app)
			.get('/lure/v1/content/uuid')
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=600, stale-while-revalidate=60, stale-if-error=86400');
	});

	context('success', () => {

		before(() => rawData = {ribbon: {}})

		it('sets appropriate cache headers', async () => {
			return request(app)
				.get('/lure/v1/content/uuid')
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
				.get('/lure/v1/content/uuid')
				.then(({body}) => {
					expect(body.rhr.title).to.equal('Latest apropos Stuff');
					expect(body.rhr.titleHref).to.equal('/adskjasdk');
				});
		})

		context('when fetching v1 style data', () => {
			before(() => {
				rawData = {
					ribbon: {
						items: getItems(5)
					},
					onward: [{
						items: getItems(5),
					}, {
						items: getItems(6)
					}]
				};
			})

			it('transforms v1 style data to v1', () => {
				return request(app)
					.get('/lure/v1/content/uuid')
					.then(({body}) => {
						expect(body.rhr.recommendations.length).to.equal(5);
						expect(Array.isArray(body.onward)).to.be.true;
						expect(body.onward[0].recommendations.length).to.equal(3);
						expect(body.onward[1].recommendations.length).to.equal(3);
						expect(uniqueIds('recommendations', body.onward)).to.be.true;
					})
			})

			it('serves v1 style data from v2 by default', () => {
				return request(app)
					.get('/lure/v2/content/uuid')
					.then(({body}) => {
						expect(body.ribbon.items.length).to.equal(5);
						expect(Array.isArray(body.onward)).to.be.true;
						expect(body.onward[0].items.length).to.equal(3);
						expect(body.onward[1].items.length).to.equal(3);
						expect(uniqueIds('items', body.onward)).to.be.true;
					})
			})

			it('transforms v1 style data to v2 if flag on', () => {
				rawData.onward[1].items = getItems(8);
				return request(app)
					.get('/lure/v2/content/uuid')
					.set('ft-flags', 'cleanOnwardJourney:on')
					.then(({body}) => {
						expect(body.ribbon.items.length).to.equal(4);
						expect(Array.isArray(body.onward)).to.be.false;
						expect(body.onward.items.length).to.equal(8);
						expect(uniqueIds('items', [body.onward])).to.be.true;
					})
			})
		})
		context('when fetching v2 style data', () => {
			before(() => {
				rawData = {
					ribbon: {
						items: getItems(5)
					},
					onward: {
						items: getItems(8),
					}
				};
			})

			it('transforms v2 style data to v1', () => {
				return request(app)
					.get('/lure/v1/content/uuid')
					.then(({body}) => {
						expect(body.rhr.recommendations.length).to.equal(5);
						expect(Array.isArray(body.onward)).to.be.true;
						expect(body.onward[0].recommendations.length).to.equal(3);
						expect(body.onward[1].recommendations.length).to.equal(3);
						expect(uniqueIds('recommendations', body.onward)).to.be.true;
					})
			})

			it('serves v1 style data from v2 by default', () => {
				return request(app)
					.get('/lure/v2/content/uuid')
					.then(({body}) => {
						expect(body.ribbon.items.length).to.equal(5);
						expect(Array.isArray(body.onward)).to.be.true;
						expect(body.onward[0].items.length).to.equal(3);
						expect(body.onward[1].items.length).to.equal(3);
						expect(uniqueIds('items', body.onward)).to.be.true;
					})
			})

			it('transforms v2 style data to v2 if flag on', () => {
				return request(app)
					.get('/lure/v2/content/uuid')
					.set('ft-flags', 'cleanOnwardJourney:on')
					.then(({body}) => {
						expect(body.ribbon.items.length).to.equal(4);
						expect(Array.isArray(body.onward)).to.be.false;
						expect(body.onward.items.length).to.equal(8);
						expect(uniqueIds('items', [body.onward])).to.be.true;
					})
			})
		})
	})
})
