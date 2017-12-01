const chai = require('chai');
const expect = chai.expect;
chai.use(require('sinon-chai'));
const proxyquire = require('proxyquire');

const sinon = require('sinon');

const getMockArgs = (sandbox, headers = {}) => {
	return [{
		get: sandbox.stub().callsFake(key => headers[key]),
		query: {},
		params: {
			contentId: 'content-id'
		}
	}, {
		locals: {
			flags: {},
			slots: {rhr: true},
			edition: 'uk',
			content: {
				id: 'content-id'
			}
		},
		FT_NO_CACHE: 'no cache',
		FT_HOUR_CACHE: 'hour cache',
		set: sandbox.stub(),
		vary: sandbox.stub(),
		status: sandbox.stub().returns({end: () => null}),
		json: sandbox.stub()
	}, () => null];
};

describe('get recommendations', () => {
	let middleware;
	let sandbox;
	let signalStubs;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		signalStubs = {
			topStories: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots),
			relatedContent: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots),
			timeRelevantRecommendations: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots),
			essentialStories: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots)
		};
		middleware = proxyquire('../../server/middleware/get-recommendations', {
			'../signals': signalStubs
		});
	});

	afterEach(() => sandbox.restore());

	context('related content', () => {
		it('use related content by default', async () => {
			const mocks = getMockArgs(sandbox);
			await middleware(...mocks);
			expect(signalStubs.relatedContent.calledOnce).to.be.true;
			expect(signalStubs.topStories.notCalled).to.be.true;
		});
	});

	context('top stories', () => {
		it('use top stories when lureTopStories flag is on', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.lureTopStories = true;
			await middleware(...mocks);
			expect(signalStubs.relatedContent.notCalled).to.be.true;
			expect(signalStubs.topStories.calledOnce).to.be.true;
		});
	});

	context('Time relevant recommendations', () => {
		it('call time relevant recommendations when lureTimeRelevantRecommendations flag is on', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.lureTimeRelevantRecommendations = true;
			await middleware(...mocks);
			expect(signalStubs.relatedContent.notCalled).to.be.true;
			expect(signalStubs.topStories.notCalled).to.be.true;
			expect(signalStubs.timeRelevantRecommendations.calledOnce).to.be.true;
		});

		it('fallback to top stories when lureTopStories flag also on and no time specific results', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.lureTimeRelevantRecommendations = true;
			mocks[1].locals.flags.lureTopStories = true;
			signalStubs.timeRelevantRecommendations.callsFake(async () => null);
			await middleware(...mocks);
			expect(signalStubs.relatedContent.notCalled).to.be.true;
			expect(signalStubs.topStories.calledOnce).to.be.true;
			expect(signalStubs.timeRelevantRecommendations.calledOnce).to.be.true;
		});

		it('fallback to top stories when no time specific results', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.lureTimeRelevantRecommendations = true;
			signalStubs.timeRelevantRecommendations.callsFake(async () => null);
			await middleware(...mocks);
			expect(signalStubs.relatedContent.calledOnce).to.be.true;
			expect(signalStubs.timeRelevantRecommendations.calledOnce).to.be.true;
		});
	});

	context('essential stories', () => {
		it('use essential stories when cleanOnwardJourney flag is on, refererCohort flag is search, and content._editorialComponents is defined', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.cleanOnwardJourney = true;
			mocks[1].locals.flags.refererCohort = 'search';
			mocks[1].locals.content._editorialComponents = ['editorial component'];
			await middleware(...mocks);
			expect(signalStubs.essentialStories.calledOnce).to.be.true;
		});
	});

});
