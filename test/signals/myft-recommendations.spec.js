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
let params;

describe('myFT Recommendations', () => {

	beforeEach(() => {
		stubs.fetchres.json.returns({ data: {user: {followed: []}}});
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({ followsConcepts: true, articles: ['article1','article2','article3','article4','article5','article6','article7','article8'] }));
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

	it('should return correct response', () => {
		const correctResponse = {
			onward: {
				title: 'Your latest myFT stories',
				titleHref: '/myft/00000000-0000-0000-0000-000000000000',
				items: [ 'article1', 'article2', 'article3', 'article4', 'article5', 'article6', 'article7', 'article8' ]
			}
		};

		return subject({}, params)
			.then(result => {
				expect(result).to.eql(correctResponse);
			})
	});

});
