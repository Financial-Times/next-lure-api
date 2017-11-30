const { expect } = require('chai');
const subject = require('../../server/signals/essential-stories')

describe('essential-stories signal', () => {

	it('should return null when there is not enough stories', () => {
		const content = {
			_editorialComponents: [
				{ stories: [ 'story1', 'story2'] }
			]
		}
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result).to.eql(null);
	});

	it('should set correct properties in response', () => {
		const content = {
			_editorialComponents: [
				{
					stories: [ 'story1', 'story2']
				},
				{
					stories: [ 'story3', 'story4', 'story5']
				}
			]
		}
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result).to.have.property('rhr');
		expect(result).to.have.nested.property('rhr.items');
		expect(result).to.have.nested.property('rhr.title').and.to.equal('Essential stories related to this article');
		expect(result).to.have.nested.property('rhr.titleHref').and.to.equal('/');
	});

	it('should set all stories from editorialComponents property in content to rhr', () => {
		const content = {
			_editorialComponents: [
				{
					stories: [ 'story1', 'story2']
				},
				{
					stories: [ 'story3', 'story4', 'story5']
				}
			]
		}
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result.rhr.items).to.eql(['story1', 'story2', 'story3', 'story4', 'story5']);
	});

	it('should set correct number of stories', () => {
		const content = {
			_editorialComponents: [
				{
					stories: [ 'story1', 'story2', 'story3']
				},
				{
					stories: [ 'story4', 'story5', 'story6']
				}
			]
		}
		const result = subject(content, { locals: { q1Length: 5 }});
		expect(result.rhr.items).to.eql(['story1', 'story2', 'story3', 'story4', 'story5']);
	});

});
