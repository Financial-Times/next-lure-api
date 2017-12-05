const { expect } = require('chai');
const subject = require('../../server/signals/myft-recommendations');


describe('myFT Recommendations', () => {

	beforeEach(() => {
		params = { locals: { slots: { ribbon: true }, userId:'', q1Length: 5 }};
	});

	it('should return correct response', () => {
		const result = subject({}, params);
		expect(result).to.eql({});
	});

});
