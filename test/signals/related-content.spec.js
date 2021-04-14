const chai = require('chai');
const expect = chai.expect;
chai.use(require('sinon-chai'));
const proxyquire = require('proxyquire');

const sinon = require('sinon');

describe('related-content signal', () => {
	let subject;
	let stubs;
	const defaultResults = {
		items: [{id: 1}],
		concepts: [{
			predicate: 'http://www.ft.com/ontology/annotation/about',
			id: 0
		}, {
			predicate: 'http://www.ft.com/ontology/classification/isPrimarilyClassifiedBy',
			id: 1
		}]
	};
	let results;

	beforeEach(() => {
		results = Object.assign({}, defaultResults);
		stubs = {
			getMostRelatedConcepts: sinon.stub().callsFake(() => results.concepts),
			getRelatedContent: sinon.stub().callsFake(() => results)
		};
		subject = proxyquire('../../server/signals/related-content', {
			'../lib/get-most-related-concepts': stubs.getMostRelatedConcepts,
			'../lib/get-related-content': stubs.getRelatedContent
		});
	});

	context('onward slot', () => {

		it('use get-most-related-concepts to pick concepts', () => {
			return subject({
				id: 'parent-id',
				curatedRelatedContent: []
			}, {locals: {slots: {onward: true}}})
				.then(() => {
					expect(stubs.getMostRelatedConcepts).calledWith({
						id: 'parent-id',
						curatedRelatedContent: []
					});
				});
		});

		it('return empty object if no concepts available', () => {
			results.concepts = undefined;
			return subject({
				id: 'parent-id',
				curatedRelatedContent: []
			}, {locals: {slots: {onward: true}}})
				.then(result => {
					expect(result).to.eql({});
				});
		});

		it('don\'t show if no teasers', () => {
			results.items = [];
			return subject({
				id: 'parent-id',
				curatedRelatedContent: [],
				annotations: [{
					predicate: 'http://www.ft.com/ontology/annotation/about',
					id: 0
				}]
			}, {locals: {slots: {onward: true}}})
				.then(result => {
					expect(result).to.eql({});
				});
		});

	});

	context('ribbon slot', () => {


		it('show correct number of stories', () => {
			results.items = [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 } ];
			return subject({
				id: 'parent-id',
				annotations: [{
					predicate: 'http://www.ft.com/ontology/annotation/about',
					id: 0
				}]
			}, {locals: {slots: {ribbon: true}}})
				.then(result => {
					expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4, ]);
				});
		});
	});

	context('brandOnwards slot', () => {
		it('doesn\`t return brandOnward slot if no brand concept available', () => {
			return subject({
				id: 'parent-id',
				curatedRelatedContent: [],
			}, { locals: { slots: { brandOnward: true }}})
				.then(result => {
					expect(result).to.not.include.keys('brandOnward');
				});
		});

		it('returns correct number of stories in slot', () => {
			results.items = [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 } ];

			return subject({
				id: 'parent-id',
				annotations: [{
					directType: 'http://www.ft.com/ontology/product/Brand',
					id: 0
				}]
			}, { locals: { slots: { brandOnward: true }}})
				.then(result => {
					expect(result.brandOnward.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4, ]);
				});
		});
	});
});
