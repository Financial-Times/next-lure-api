const { expect } = require('chai');
const subject = require('../../server/signals/essential-stories');
let content;

describe('essential-stories signal', () => {

	beforeEach(() => {
		content = {
			_editorialComponents: [
				{ stories: [ 'story1', 'story2'] },
				{ stories: [ 'story3', 'story4', 'story5'] }
			]
		};
	});

	it('should return null when there is not enough stories', () => {
		content = { _editorialComponents: [{ stories: [ 'story1', 'story2'] }] }
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result).to.eql(null);
	});

	it('should set correct properties in response', () => {
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result).to.have.property('ribbon');
		expect(result).to.have.nested.property('ribbon.items');
		expect(result).to.have.nested.property('ribbon.title').and.to.equal('Essential stories related to this article');
		expect(result).to.have.nested.property('ribbon.titleHref').and.to.equal('/');
	});

	it('should set all stories from editorialComponents property in content to ribbon', () => {
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result.ribbon.items).to.eql(['story1', 'story2', 'story3', 'story4', 'story5']);
	});

	it('should set correct number of stories', () => {
		content = {
			_editorialComponents: [
				{ stories: [ 'story1', 'story2', 'story3'] },
				{ stories: [ 'story4', 'story5', 'story6'] }
			]
		}
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result.ribbon.items).to.eql(['story1', 'story2', 'story3', 'story4', 'story5']);
	});

});
