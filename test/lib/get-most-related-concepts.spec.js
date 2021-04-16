const {expect} = require('chai');
const subject = require('../../server/lib/get-most-related-concepts');

describe('get most related concepts', () => {
	it('use about, isPrimarilyClassifiedBy and implicitlyAbout by default', () => {
		const result = subject({
			annotations: [
				{
					predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
					directType: 'http://www.ft.com/ontology/Topic',
					id: 'should-be-ignored',
				},
				{
					predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
					directType: 'http://www.ft.com/ontology/product/Brand',
					id: 3,
				},
				{
					predicate: 'http://www.ft.com/ontology/implicitlyAbout',
					id: 2,
				},
				{
					predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
					directType: 'http://www.ft.com/ontology/Topic',
					id: 'should-be-ignored',
				},
				{
					predicate: 'http://www.ft.com/ontology/classification/isPrimarilyClassifiedBy',
					id: 1,
				},{
					predicate: 'http://www.ft.com/ontology/annotation/about',
					id: 0,
				},
				{
					predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
					directType: 'http://www.ft.com/ontology/Topic',
					id: 'should-be-ignored',
				}
			]
		});
		expect(result[0].id).to.equal(0);
		expect(result[1].id).to.equal(1);
		expect(result[2].id).to.equal(2);
		expect(result[3].id).to.equal(3);
		expect(result.length).to.equal(4);
	});

	it('handle case where only one preferred annotation is present', () => {
		const result = subject({
			annotations: [
				{
					predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
					directType: 'http://www.ft.com/ontology/Topic',
					id: 'should-be-ignored',
				},
				{
					predicate: 'http://www.ft.com/ontology/classification/isPrimarilyClassifiedBy',
					id: 1
				}
			]
		});
		expect(result[0].id).to.equal(1);
		expect(result.length).to.equal(1);
	});

	it('handle case where no preferred annotations are present', () => {
		const result = subject({
			annotations: [
				{
					predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
					directType: 'http://www.ft.com/ontology/Topic',
					id: 'should-be-ignored',
				},
				{
					predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
					directType: 'http://www.ft.com/ontology/Topic',
					id: 'should-be-ignored',
				},
			]
		});
		expect(result).to.be.undefined;
	});

	it('handle case where no annotations are present', () => {
		const result = subject({
			annotations: []
		});
		expect(result).to.be.undefined;
	});

	it('handle case where content has no annotations', () => {
		const result = subject({});
		expect(result).to.be.undefined;
	});
});
