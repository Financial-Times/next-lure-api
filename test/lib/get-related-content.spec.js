const { expect } = require('chai');
const es = require('@financial-times/n-es-client');
const subject = require('../../server/lib/get-related-content');
const sinon = require('sinon');

describe('get related content', () => {
	beforeEach(() => {
		sinon.stub(es, 'search').returns(Promise.resolve([{id: 'parent-id'}, {id: 'not-parent-id'}]));
	});
	afterEach(() => {
		es.search.restore();
	});
	it('request count x 2 articles', async () => {
		const concept = {id: 'concept-id', predicate: 'http://www.ft.com/ontology/annotation/about', directType: 'http://www.ft.com/ontology/Topic'};
		await subject(concept, 3, 'parent-id');
		expect(es.search.args[0][0].size).to.equal(6);
	});

	it('remove parent article id', async () => {
		const concept = {id: 'concept-id', predicate: 'http://www.ft.com/ontology/annotation/about', directType: 'http://www.ft.com/ontology/Topic'};
		const result = await subject(concept, 3, 'parent-id');
		expect(result.items.map(obj => obj.id)).to.eql(['not-parent-id']);
	});

	it('query by concept id', async () => {
		const concept = {id: 'concept-id', predicate: 'http://www.ft.com/ontology/annotation/about', directType: 'http://www.ft.com/ontology/Topic'};
		await subject(concept, 3, 'parent-id');
		expect(es.search.args[0][0].query).to.eql({ term: { 'annotations.id': 'concept-id' } });
	});


	describe('teaser formats', () => {
		it('requests teaser format', async () => {
			const concept = {id: 'concept-id', predicate: 'http://www.ft.com/ontology/annotation/about', directType: 'http://www.ft.com/ontology/Topic'};
			await subject(concept, 3, 'parent-id', null);
			expect(es.search.args[0][0]['_source']).to.deep.equal(['id', 'teaser.*']);
		});
	});

	describe('tracking', () => {

		it('output correct tracking for about', async () => {
			const result = await subject({
				predicate: 'http://www.ft.com/ontology/annotation/about',
				directType: 'http://www.ft.com/ontology/Topic',
				id: 0,
			});
			expect(result.items[0].originator).to.equal('about');
		});

		it('output correct tracking for isPrimarilyClassifiedBy', async () => {
			const result = await subject({
				predicate: 'http://www.ft.com/ontology/annotation/isPrimarilyClassifiedBy',
				directType: 'http://www.ft.com/ontology/Topic',
				id: 0,
			});
			expect(result.items[0].originator).to.equal('isPrimarilyClassifiedBy');
		});

		it('output correct tracking for brand with isClassifiedBy predicate', async () => {
			const result = await subject({
				predicate: 'http://www.ft.com/ontology/classification/isClassifiedBy',
				directType: 'http://www.ft.com/ontology/product/Brand',
				id: 0,
			});
			expect(result.items[0].originator).to.equal('isClassifiedBy-brand');
		});

		it('output correct tracking for brand with isImplicitlyClassifiedBy predicate', async () => {
			const result = await subject({
				predicate: 'http://www.ft.com/ontology/classification/isImplicitlyClassifiedBy',
				directType: 'http://www.ft.com/ontology/product/Brand',
				id: 0,
			});
			expect(result.items[0].originator).to.equal('isImplicitlyClassifiedBy-brand');
		});


	});

});
