const { expect } = require('chai');
const { canShowBottomSlotOnPage } = require('../../server/lib/can-show-on-page');

describe('lib/can-show-in-slot.js', () => {

	describe('canShowBottomSlotOnPage', () => {
		it('happy path', () => {
			const content = { id: 'content-id' };
			const result = canShowBottomSlotOnPage(content);
			expect(result).to.eql(true);
		});

		it('Does not matter if the content has a topper', () => {
			const content = { topper: {} };
			const result = canShowBottomSlotOnPage(content);
			expect(result).to.eql(true);
		});

		it('Content containedIn in NO ContentPackages', () => {
			const content = { containedIn: [] };
			const result = canShowBottomSlotOnPage(content);
			expect(result).to.eql(true);
		});

		it('Content containedIn in One ContentPackages', () => {
			const content = { containedIn: [ {id:'content-package'} ] };
			const result = canShowBottomSlotOnPage(content);
			expect(result).to.eql(false);
		});
	});
});
