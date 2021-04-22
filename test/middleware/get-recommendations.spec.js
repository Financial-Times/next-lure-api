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
	let relatedContentStub;
	let responseFromRelatedContent;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		relatedContentStub = sandbox.stub().callsFake(async (content, {locals: {slots}}) => slots);
		middleware = proxyquire('../../server/middleware/get-recommendations', {
			'../signals/related-content': relatedContentStub
		});
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
			expect(relatedContentStub.calledOnce).to.be.true;
		});
	});

	context('Incomplete slot', () => {

		let mocks;

		context('[ onward ]', () => {
			beforeEach(() => {
				mocks = getMockArgs(sandbox);
				mocks[1].locals.slots = { onward: true };
			});

			it('should be padded items from Related Content when a slot is short of items', async () => {
				relatedContentStub.returns(Promise.resolve(responseFromRelatedContent));
				await middleware(...mocks);
				expect(relatedContentStub.calledOnce).to.be.true;
			});

			it('should be set title/titleHref/concept from Related Content when recommendation items is less than the half of the slot', async () => {
				relatedContentStub.returns(Promise.resolve(responseFromRelatedContent));
				await middleware(...mocks);
				expect(mocks[1].locals.recommendations.onward.title).to.eql('From Related Content');
				expect(mocks[1].locals.recommendations.onward.titleHref).to.eql('/related-content');
				expect(mocks[1].locals.recommendations.onward.concept).to.eql('concept from Related Content');
			});
		});
	});

});
