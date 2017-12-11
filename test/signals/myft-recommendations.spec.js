const { expect } = require('chai');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();
const stubs = {
	fetch: sandbox.stub(),
	fetchres: { json: sandbox.stub() },
	transformMyftData: { extractArticlesFromConcepts: sandbox.stub() }
}
const proxyquire = require('proxyquire');
const subject = proxyquire('../../server/signals/myft-recommendations', {
	'fetchres': stubs.fetchres,
	'../lib/transform-myft-data': stubs.transformMyftData
});
const eightArticles = ['article1','article2','article3','article4','article5','article6','article7','article8'];
let params;


describe('myFT Recommendations', () => {

	beforeEach(() => {
		stubs.fetchres.json.returns({ data: {user: {followed: []}}});
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({ followsConcepts: true, articles: eightArticles }));
		params = {
			locals: {
				slots: { onward: true },
				userId:'00000000-0000-0000-0000-000000000000',
				q2Length: 8
			}
		};
	});

	it('should return null if userId has not passed', () => {
		params.locals.userId = undefined;
		return subject({}, params)
			.then(result => {
				expect(result).to.eql(null);
			})
	});

	it('should return null if article data after transformation is undefined', () => {
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({}));
		return subject({}, params)
			.then(result => {
				expect(result).to.eql(null);
			})
	});

	it('should return null if article data after transformation is less than q2Length', () => {
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({ followsConcepts: true, articles: ['article1'] }));
		return subject({}, params)
			.then(result => {
				expect(result).to.eql(null);
			})
	});

	it('should return response with correct properties', () => {
		const correctResponse = {
			onward: {
				title: 'Your latest myFT stories',
				titleHref: '/myft/00000000-0000-0000-0000-000000000000',
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
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({ followsConcepts: true, articles: nineArticles }));
		const correctResponse = {
			onward: {
				title: 'Your latest myFT stories',
				titleHref: '/myft/00000000-0000-0000-0000-000000000000',
				items: eightArticles
			}
		};

		return subject({}, params)
			.then(result => {
				expect(result).to.eql(correctResponse);
			})
	});

});
