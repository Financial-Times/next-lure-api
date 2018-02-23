const chai = require('chai');
const expect = chai.expect;
chai.use(require('sinon-chai'));
const proxyquire = require('proxyquire');

const sinon = require('sinon');
const es = require('@financial-times/n-es-client');

describe('related-content signal', () => {
	let subject;
	let stubs;
	const defaultResults = {
		esSearch: [{id: 1}],
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
		sinon.stub(es, 'search').callsFake(() => Promise.resolve(results.esSearch));
		stubs = {
			getMostRelatedConcepts: sinon.stub().callsFake(() => results.concepts)
		};
		subject = proxyquire('../../server/signals/related-content', {
			'../lib/get-most-related-concepts': stubs.getMostRelatedConcepts
		});
	});

	afterEach(() => es.search.restore());

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

		it('avoid recommending the current article!', () => {
			results.esSearch = [{id: 1}, {id: 2}];
			return subject({
				id: 1,
				curatedRelatedContent: [],
				annotations: [{
					predicate: 'http://www.ft.com/ontology/annotation/about',
					id: 0
				}]
			}, {locals: {slots: {onward: true}}})
				.then(result => {
					expect(result.onward.items.map(item => item.id)).to.eql([2]);
				});
		});

		it('get enough content', () => {
			let calls = 0;
			es.search.restore(); // remove the default stub
			sinon.stub(es, 'search').callsFake(() => {
				return Promise.resolve(
					[...Array(6)]
						.map((v, i) => ({id: i + (6 * calls)}))
				);
			});
			return subject({
				id: 'parent-id',
				curatedRelatedContent: [],
				annotations: [{
					predicate: 'http://www.ft.com/ontology/annotation/about',
					id: 0
				}]
			}, {locals: {slots: {onward: true}}})
				.then(() => {
					expect(es.search.args[0][0].size).to.equal(9);
				});
		});

		it('don\'t show if no teasers', () => {
			results.esSearch = [];
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
			results.esSearch = [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 } ];
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
});
