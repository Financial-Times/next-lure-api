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
	let responseFromEssentialStories;
	let responseFromRelatedContent;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		signalStubs = {
			relatedContent: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots),
			essentialStories: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots),
			ftRexRecommendations: sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots)
		};
		middleware = proxyquire('../../server/middleware/get-recommendations', {
			'../signals': signalStubs
		});
		responseFromEssentialStories = {
			ribbon: {
				title: 'From Essential Stories',
				titleHref: '/essential-stories',
				concept: 'concept from Essential Stories',
				items: [{id:'es-1'},{id:'es-2'},{id:'es-3'},{id:'es-4'}]
			}
		};

		responseFromRelatedContent = {
			ribbon: {
				title: 'From Related Content',
				titleHref: '/related-content',
				concept: 'concept from Related Content',
				items: [{id:'rc-1'},{id:'rc-2'},{id:'rc-3'},{id:'rc-4'}]
			},
			onward: {
				title: 'From Related Content',
				titleHref: '/related-content',
				concept: 'concept from Related Content',
				items: [{id:'rc-5'},{id:'rc-6'},{id:'rc-7'},{id:'rc-8'},{id:'rc-9'},{id:'rc-10'},{id:'rc-11'}]
			}
		};
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

		it('use essential stories when refererCohort flag is search, and content._editorialComponents is defined', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.refererCohort = 'search';
			mocks[1].locals.content._editorialComponents = ['editorial component'];
			await middleware(...mocks);
			expect(signalStubs.essentialStories.calledOnce).to.be.true;
		});

		it('move next signal to get data for onward slot', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.refererCohort = 'search';
			mocks[1].locals.content._editorialComponents = ['editorial component'];
			mocks[1].locals.slots = { ribbon: true, onward: true };
			const correctRibbonItems = Object.assign({}, responseFromEssentialStories.ribbon);
			const correctOnwardItems = Object.assign({}, responseFromRelatedContent.onward);
			signalStubs.essentialStories.returns(Promise.resolve(responseFromEssentialStories));
			signalStubs.relatedContent.returns(Promise.resolve(responseFromRelatedContent));
			await middleware(...mocks);
			expect(mocks[1].locals.recommendations).to.eql({ ribbon: correctRibbonItems, onward: correctOnwardItems });
			expect(signalStubs.essentialStories.calledOnce).to.be.true;
			expect(signalStubs.relatedContent.calledOnce).to.be.true;
		});

		it('fallback to next signal when no essentialStories results', async () => {
			const mocks = getMockArgs(sandbox);
			mocks[1].locals.flags.refererCohort = 'search';
			mocks[1].locals.content._editorialComponents = ['editorial component'];
			mocks[1].locals.slots = { ribbon: true, onward: true };
			signalStubs.essentialStories.returns(Promise.resolve(null));
			signalStubs.relatedContent.returns(Promise.resolve({ ribbon: 'from Related Content', onward: 'from Related Content' }));
			await middleware(...mocks);
			expect(mocks[1].locals.recommendations).to.eql({ ribbon: 'from Related Content', onward: 'from Related Content' });
			expect(signalStubs.essentialStories.calledOnce).to.be.true;
			expect(signalStubs.relatedContent.calledOnce).to.be.true;
		});

	});

	context('Incomplete slot', () => {

		let mocks;

		context('[ ribbon ]', () => {

			beforeEach(() => {
				mocks = getMockArgs(sandbox);
				mocks[1].locals.flags.refererCohort = 'search';
				mocks[1].locals.content._editorialComponents = ['editorial component'];
				mocks[1].locals.slots = { ribbon: true, onward: true };
			});

			it('should be padded items from Related Content when a slot is short of items', async () => {
				responseFromEssentialStories.ribbon.items = responseFromEssentialStories.ribbon.items.slice(0,2);
				const correctRibbonItems = Object.assign({}, responseFromEssentialStories.ribbon, { items: [{id:'es-1'},{id:'es-2'},{id:'rc-1'},{id:'rc-2'}] });
				const correctOnwardItems = Object.assign({}, responseFromRelatedContent.onward);
				signalStubs.essentialStories.returns(Promise.resolve(responseFromEssentialStories));
				signalStubs.relatedContent.returns(Promise.resolve(responseFromRelatedContent));
				await middleware(...mocks);
				expect(mocks[1].locals.recommendations).to.eql({ ribbon: correctRibbonItems, onward: correctOnwardItems });
				expect(signalStubs.essentialStories.calledOnce).to.be.true;
				expect(signalStubs.relatedContent.calledOnce).to.be.true;
			});

			it('should be set title/titleHref/concept from Related Content when recommendation items is less than the half of the slot', async () => {
				responseFromEssentialStories.ribbon.items = responseFromEssentialStories.ribbon.items.slice(0,1);
				signalStubs.essentialStories.returns(Promise.resolve(responseFromEssentialStories));
				signalStubs.relatedContent.returns(Promise.resolve(responseFromRelatedContent));
				await middleware(...mocks);
				expect(mocks[1].locals.recommendations.ribbon.title).to.eql('From Related Content');
				expect(mocks[1].locals.recommendations.ribbon.titleHref).to.eql('/related-content');
				expect(mocks[1].locals.recommendations.ribbon.concept).to.eql('concept from Related Content');
			});
		});

		// TODO rewrite these tests with a signal which is not experimental one
		// ftRexRecommendations is an experimental signal at the moment
		context('[ onward ]', () => {

			let responseFromFtRexRecommendations;

			beforeEach(() => {
				mocks = getMockArgs(sandbox);
				mocks[1].locals.flags.lureFtRexRecommendations = true;
				mocks[1].locals.slots = { onward: true };
				responseFromFtRexRecommendations = {
					onward: {
						title: 'From FT Rex Recommendations',
						titleHref: '/ft-rex-recommendations',
						concept: 'concept from FT Rex Recommendations',
						items: [{id:'rex-5'},{id:'rex-6'},{id:'rex-7'},{id:'rex-8'}]
					}
				}
			});

			it('should be padded items from Related Content when a slot is short of items', async () => {
				const correctOnwardItems = Object.assign({}, responseFromFtRexRecommendations.onward, {
					items: [{id:'rex-5'},{id:'rex-6'},{id:'rex-7'},{id:'rex-8'},{id:'rc-5'},{id:'rc-6'},{id:'rc-7'}]
				});
				signalStubs.ftRexRecommendations.returns(Promise.resolve(responseFromFtRexRecommendations));
				signalStubs.relatedContent.returns(Promise.resolve(responseFromRelatedContent));
				await middleware(...mocks);
				expect(mocks[1].locals.recommendations).to.eql({ onward: correctOnwardItems });
				expect(signalStubs.ftRexRecommendations.calledOnce).to.be.true;
				expect(signalStubs.relatedContent.calledOnce).to.be.true;
			});

			it('should be set title/titleHref/concept from Related Content when recommendation items is less than the half of the slot', async () => {
				responseFromFtRexRecommendations.onward.items = [{id:'rex-5'},{id:'rex-6'},{id:'rex-7'}];
				signalStubs.ftRexRecommendations.returns(Promise.resolve(responseFromFtRexRecommendations));
				signalStubs.relatedContent.returns(Promise.resolve(responseFromRelatedContent));
				await middleware(...mocks);
				expect(mocks[1].locals.recommendations.onward.title).to.eql('From Related Content');
				expect(mocks[1].locals.recommendations.onward.titleHref).to.eql('/related-content');
				expect(mocks[1].locals.recommendations.onward.concept).to.eql('concept from Related Content');
			});
		});
	});

});
