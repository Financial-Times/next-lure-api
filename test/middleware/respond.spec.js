const { expect } = require('chai');
const sinon = require('sinon');

const subject = require('../../server/middleware/respond');

const FT_NO_CACHE = 'no cache';
const FT_HOUR_CACHE = 'hour cache';

describe('respond middleware', () => {

	it('throws when res.locals.recommendation is not defined', () => {
		const res = {
			locals: {
			},
			set: sinon.spy(),
			json: () => {},
			FT_NO_CACHE,
			FT_HOUR_CACHE,
		};
		expect(() => subject({}, res)).to.throw('Not Found');
	});

	it('throws when there are no recommendation slots', () => {
		const res = {
			locals: {
				recommendations: {}
			},
			set: sinon.spy(),
			json: () => {},
			FT_NO_CACHE,
			FT_HOUR_CACHE,
		};
		expect(() => subject({}, res)).to.throw('Not Found');
	});

	it('will cache the response', () => {
		const res = {
			locals: {
				recommendations: {
					items: []
				},
			},
			set: sinon.spy(),
			json: () => {},
			FT_NO_CACHE,
			FT_HOUR_CACHE,
		};
		subject({}, res);
		expect(res.set.calledWith('Cache-Control', FT_NO_CACHE)).to.be.true;
		expect(res.set.calledWith('Surrogate-Control', FT_HOUR_CACHE)).to.be.true;
	});

	it('will not cache the response if requested to do so', () => {
		const FT_NO_CACHE = 'no cache';
		const FT_HOUR_CACHE = 'hour cache';
		const res = {
			locals: {
				recommendations: {
					_noCache: true,
				}
			},
			set: sinon.spy(),
			json: () => {},
			FT_NO_CACHE,
			FT_HOUR_CACHE,
		};
		subject({}, res);
		expect(res.set.calledWith('Cache-Control', FT_NO_CACHE)).to.be.true;
		expect(res.set.calledWith('Surrogate-Control', FT_NO_CACHE)).to.be.true;
	});

	it('adds metadata describing the payload, internal processing of content and decisions made by the service', () => {

		const res = {
			locals: {
				recommendations: {
					ribbon: {
						title: 'title',
						titleHref: '/stream/id',
						items: [{}, {}, {}],
						contentSelection: 'content-selection-value'
					}
				},
				flags: {
					onwardJourneyTests: 'test-flag-value',
					decoyFlag: true,
				}
			},
			set: sinon.spy(),
			json: sinon.spy(),
			FT_NO_CACHE,
			FT_HOUR_CACHE,
		};

		const expected = {
			_metadata: {
				flagState: {
					onwardJourneyTests: 'test-flag-value'
				},
				numSlots: 1,
				totalItems: 3,
				contentSelection: {
					ribbon: 'content-selection-value'
				},
			}
		};
		subject({}, res);
		expect(res.json.getCall(0).args[0]).to.deep.include(expected);
	});
});
