const { expect } = require('chai');
const es = require('@financial-times/n-es-client');
const constants = require('../../server/constants');
const subject = require('../../server/lib/get-related-content');
const sinon = require('sinon');

describe('get related content', () => {
	beforeEach(() => {
		sinon.stub(es, 'search').returns(Promise.resolve([{id: 'parent-id'}, {id: 'not-parent-id'}]));
	});
	afterEach(() => {
		es.search.restore();
	});
	it('request count + 1 articles', async () => {
		await subject({id: 'concept-id', predicate: 'about'}, 3, 'parent-id');
		expect(es.search.args[0][0].size).to.equal(4);
	});

	it('remove parent article id', async () => {
		const result = await subject({id: 'concept-id', predicate: 'about'}, 3, 'parent-id');
		expect(result.items.map(obj => obj.id)).to.eql(['not-parent-id']);
	});

	it('by default include all genres', async () => {
		await subject({id: 'concept-id', predicate: 'about'}, 3, 'parent-id');
		expect(es.search.args[0][0].query).to.eql({ term: { 'annotations.id': 'concept-id' } });
	});

	it('can exclude news', async () => {
		await subject({id: 'concept-id', predicate: 'about'}, 3, 'parent-id', false);
		expect(es.search.args[0][0].query).to.eql({
			'bool': {
				'must': [
					{
						'term': {
							'annotations.id': 'concept-id'
						}
					}
				],
				'must_not': [
					{
						'term': {
							'genreConcept.id': constants.NEWS_CONCEPT_ID
						}
					}
				]
			}
		});
	});

	it('can exclude non news', async () => {
		await subject({id: 'concept-id', predicate: 'about'}, 3, 'parent-id', true);
		expect(es.search.args[0][0].query).to.eql({
			'bool': {
				'must': [
					{
						'term': {
							'annotations.id': 'concept-id'
						}
					},
					{
						'term': {
							'genreConcept.id': constants.NEWS_CONCEPT_ID
						}
					}
				]
			}
		});
	});

	describe('teaser formats', () => {
		it('requests teaser format', async () => {
			await subject({id: 'concept-id', predicate: 'about'}, 3, 'parent-id', null);
			expect(es.search.args[0][0]['_source']).to.deep.equal(['id', 'teaser.*']);
		});
	});

	describe('tracking', () => {

		it('output correct tracking for about', async () => {
			const result = await subject({
				predicate: 'http://www.ft.com/ontology/annotation/about',
				id: 0
			});
			expect(result.items[0].originator).to.equal('about');
		});

		it('output correct tracking for isPrimarilyClassifiedBy', async () => {
			const result = await subject({
				predicate: 'http://www.ft.com/ontology/annotation/isPrimarilyClassifiedBy',
				id: 0
			});
			expect(result.items[0].originator).to.equal('isPrimarilyClassifiedBy');
		});

		it('output correct tracking for brand', async () => {
			const result = await subject({
				predicate: 'whatevs',
				id: 0
			});
			expect(result.items[0].originator).to.equal('brand');
		});

	});

});
