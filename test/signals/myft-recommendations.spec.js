const { expect } = require('chai');
const subject = require('../../server/signals/myft-recommendations');
let params;

describe('myFT Recommendations', () => {

	beforeEach(() => {
		params = { locals: { slots: { ribbon: true }, userId:'', q1Length: 5 }};
	});

	// it('should return correct response', () => {
	// 	return subject({}, params)
	// 		.then(result => {
	// 			expect(result).to.eql({ data : { popularConcepts : [], user: { followed: [] } }});
	// 		})
	// });

});
