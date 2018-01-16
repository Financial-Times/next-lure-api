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
			slots: { ribbon: true },
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
			relatedContent: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots),
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

		it.only('move next signal to get data for onward slot', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.cleanOnwardJourney = true;
			mocks[1].locals.flags.refererCohort = 'search';
			mocks[1].locals.content._editorialComponents = ['editorial component'];
			mocks[1].locals.slots= { ribbon: true, onward: true };
			signalStubs.essentialStories.returns(Promise.resolve({ ribbon: { items : [1,2,3,4] } }));
			signalStubs.relatedContent.returns(Promise.resolve({ ribbon: { items : [1,2,3,4] }, onward: { items : [5,6,7,8,9,10,11] } }));
			await middleware(...mocks);
			expect(mocks[1].locals.recommendations).to.eql({ ribbon: 'from Essential Stories', onward: 'from Related Content' });
			expect(signalStubs.essentialStories.calledOnce).to.be.true;
			expect(signalStubs.relatedContent.calledOnce).to.be.true;
		});

		it('fallback to next signal when no essentialStories results', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.cleanOnwardJourney = true;
			mocks[1].locals.flags.refererCohort = 'search';
			mocks[1].locals.content._editorialComponents = ['editorial component'];
			mocks[1].locals.slots= { ribbon: true, onward: true };
			signalStubs.essentialStories.returns(Promise.resolve(null));
			signalStubs.relatedContent.returns(Promise.resolve({ ribbon: 'from Related Content', onward: 'from Related Content' }));
			await middleware(...mocks);
			expect(mocks[1].locals.recommendations).to.eql({ ribbon: 'from Related Content', onward: 'from Related Content' });
			expect(signalStubs.essentialStories.calledOnce).to.be.true;
			expect(signalStubs.relatedContent.calledOnce).to.be.true;
		});

	});

});
