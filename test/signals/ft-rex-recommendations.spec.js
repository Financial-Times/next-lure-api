const { expect } = require('chai');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();
const stubs = {
	fetchres: { json: sandbox.stub() },
	es: { mget: sandbox.stub() }
}
const proxyquire = require('proxyquire');
const subject = proxyquire('../../server/signals/ft-rex-recommendations', {
	'fetchres': stubs.fetchres,
	'@financial-times/n-es-client': stubs.es
});

const TEASER_PROPS = require('@financial-times/n-teaser').esQuery;
const eightArticleIds = ['id-1','id-2','id-3','id-4','id-5','id-6','id-7','id-8'];
const eightArticles = ['article1', 'article2', 'article3', 'article4', 'article5', 'article6', 'article7', 'article8'];
let params;

describe('myFT Recommendations', () => {

	beforeEach(() => {
		stubs.fetchres.json.returns(eightArticleIds);
		stubs.es.mget.returns( Promise.resolve(eightArticles) );
		params = {
			locals: {
				slots: { onward: true },
				q2Length: 8
			}
		};
	});

	it('should return null if slots.onward is false', () => {
		params.locals.slots.onward = false;
		return subject({}, params)
			.then(result => {
				expect(result).to.equal(null);
			})
	});

	it('should return null if article ids from ft-rex is less than q2Length', () => {
		stubs.fetchres.json.returns( Promise.resolve(['id-1']) );
		return subject({}, params)
			.then(result => {
				expect(result).to.equal(null);
			})
	});

	it('should return null if article data from es is not fetched', () => {
		stubs.es.mget.returns( Promise.reject() );
		return subject({}, params)
			.then(result => {
				expect(result).to.equal(null);
			})
	});

	it('should return null if article data from es is less than q2Length', () => {
		stubs.es.mget.returns( Promise.resolve(['article1']) );
		return subject({}, params)
			.then(result => {
				expect(result).to.equal(null);
			})
	});

	it('should call es client with correct arguments', () => {
		const correctArg = {
			docs: eightArticleIds.map(id => ({ _id: id, _source: TEASER_PROPS }))
		};
		return subject({}, params)
			.then(() => {
				expect(stubs.es.mget.calledWith(correctArg)).to.be.true;
			})
	});

	it('should return response with correct properties', () => {
		const correctResponse = {
			onward: {
				title: 'ft rex recommendations',
				titleHref: '/',
				items: eightArticles
			}
		};

		return subject({}, params)
			.then(result => {
				expect(result).to.eql(correctResponse);
			})
	});

	it('should return correct number(= q2Length) of article data', () => {
		const nineArticles = [...eightArticles].concat('article9');
		stubs.es.mget.returns( Promise.resolve(nineArticles) );
		const correctResponse = {
			onward: {
				title: 'ft rex recommendations',
				titleHref: '/',
				items: eightArticles
			}
		};

		return subject({}, params)
			.then(result => {
				expect(result).to.eql(correctResponse);
			})
	});
});
