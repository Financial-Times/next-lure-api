const { expect } = require('chai');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();
const stubs = {
	fetch: sandbox.stub(),
	fetchres: { json: sandbox.stub() },
	transformMyftData: { extractArticlesFromConcepts: sandbox.stub() },
	getSession: sandbox.stub(),
};
const proxyquire = require('proxyquire');
const subject = proxyquire('../../server/signals/myft-recommendations', {
	'fetchres': stubs.fetchres,
	'../lib/transform-myft-data': stubs.transformMyftData,
	'../lib/get-session': stubs.getSession,
});
let eightArticles;
let params;


describe('myFT Recommendations', () => {

	beforeEach(() => {
		stubs.fetchres.json.returns({ data: {user: {followed: []}}});
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({ followsConcepts: true, articles: eightArticles }));
		stubs.getSession.returns(Promise.resolve({ uuid: '00000000-0000-0000-0000-000000000000' }));
		params = {
			locals: {
				slots: { onward: true },
				userId: '00000000-0000-0000-0000-000000000000',
				secureSessionToken: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
			}
		};
		eightArticles = [{ id: '1'}, { id: '2'}, { id: '3'}, { id: '4'}, { id: '5'}, { id: '6'}, { id: '7'}, { id: '8'}];
	});

	it('should return null if userId has not passed', () => {
		params.locals.userId = undefined;
		return subject({}, params)
			.then(result => {
				expect(result).to.eql(null);
			});
	});

	it('should return null if article data after transformation is undefined', () => {
			stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({}));
		return subject({}, params)
			.then(result => {
				expect(result).to.eql(null);
			});
	});

	it('should return null if article data after transformation is less than q2Length', () => {
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({ followsConcepts: true, articles: ['article1'] }));
		return subject({}, params)
			.then(result => {
				expect(result).to.eql(null);
			});
	});

	it('should return response with correct properties', () => {
		const correctItems = eightArticles.slice(0, 7);
		correctItems.forEach(item => item.originator = 'myft-recommendations');
		const correctResponse = {
			onward: {
				title: 'Your latest myFT stories',
				titleHref: '/myft/00000000-0000-0000-0000-000000000000',
				items: correctItems
			}
		};

		return subject({}, params)
			.then(result => {
				expect(result).to.eql(correctResponse);
			});
	});

	it('should return correct number(= q2Length) of article data', () => {
		const nineArticles = [{ id: '1'}, { id: '2'}, { id: '3'}, { id: '4'}, { id: '5'}, { id: '6'}, { id: '7'}, { id: '8'}, { id: '9'}];
		stubs.transformMyftData.extractArticlesFromConcepts.returns(Promise.resolve({ followsConcepts: true, articles: nineArticles }));

		const correctItems = eightArticles.slice(0, 7);
		correctItems.forEach(item => item.originator = 'myft-recommendations');
		const correctResponse = {
			onward: {
				title: 'Your latest myFT stories',
				titleHref: '/myft/00000000-0000-0000-0000-000000000000',
				items: correctItems
			}
		};

		return subject({}, params)
			.then(result => {
				expect(result).to.eql(correctResponse);
			});
	});

	it('should return null if user ID is not valid', () => {
		stubs.getSession.returns(Promise.resolve({ uuid: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' }));
		return subject({}, params)
			.then(result => {
				expect(result).to.eql(null);
			});
	});

});
