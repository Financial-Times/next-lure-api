const { expect } = require('chai');
const subject = require('../../server/lib/get-brand-concept');

describe('get brand concept', () => {
	it('return undefined if content has no annotations', () => {
		const result = subject({});

		expect(result).to.be.undefined;
	});

	it('use directType to find concept', () => {
		const result = subject({
			annotations: [{
				directType: 'http://www.ft.com/ontology/product/Brand',
				id: 0
			}]
		});

		expect(result.id).to.equal(0);
	});
});
