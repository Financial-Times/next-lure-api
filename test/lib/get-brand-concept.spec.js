const { expect } = require('chai');
const subject = require('../../server/lib/get-brand-concept');

const { ConceptType, Predicate } = require('../../server/lib/content');

subject.priorityList = new Map([
	['high', 4],
	['high-2', 4],
	['medium', 2],
	['medium-2', 2],
	['low', 1],
	['negative', -1],
]);

subject.fallbackConcepts = [
	'fallback'
];

const annotation = (type, predicate, id) => ({
	directType: type || ConceptType.Topic,
	predicate: predicate || Predicate.about,
	id: id || '123',
});

const createFixture = array => ({
	annotations: array.map(row => annotation(row[0], row[1], row[2]))
});

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

	const test = (expected, annotations) => (
		function () {
			expect(subject(createFixture(annotations)).id).to.equal(expected);
		}
	);

	it('no brands', () => {
		expect(subject(createFixture([[ConceptType.Topic, Predicate.about, 'decoy']]))).to.be.undefined;
	});

	it('no annotations', () => {
		expect(subject(createFixture([]))).to.be.undefined;
	});

	it('single brand isClassifiedBy', test('brand-id', [
		[ConceptType.Brand, Predicate.isClassifiedBy, 'brand-id'],
	]));

	it('single brand implicitlyClassifiedBy', test('brand-id', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'brand-id'],
	]));

	it('2 brands: one isClassifiedBy and one implicitlyClassifiedBy', test('isClassifiedBy', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'implicitlyClassifiedBy'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'isClassifiedBy'],
	]));

	it('with 2 brands, both implicitlyClassifiedBy, select the first to appear', test('implicitlyClassifiedBy-a', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'implicitlyClassifiedBy-a'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'implicitlyClassifiedBy-b'],
	]));

	it('with two brands that have the same priority, choose the one that is isClassifiedBy', test('high', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high-2'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'high'],
	]));

	it('with two implicitlyClassifiedBy brands that have the same priority, select the first to appear', test('high', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high-2'],
	]));

	it('use priority to promote an implicitlyClassifiedBy brand when there are multiple prioritised implicitlyClassifiedBy brands', test('high', [
		[ConceptType.Brand, Predicate.isClassifiedBy, 'decoy'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'medium'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'decoy'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'low'],
	]));

	it('use highest priority when 2 implicitlyClassifiedBy brands have weightings and there is no isClassifiedBy brand', test('high', [
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'decoy'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'low'],
	]));

	it('use high priority isClassifiedBy brand', test('high', [
		[ConceptType.Brand, Predicate.isClassifiedBy, 'high'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'low'],
	]));

	it('high priority implicitlyClassifiedBy does not beat medium priority isClassifiedBy', test('medium', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'medium'],
	]));

	it('high priority implicitlyClassifiedBy beats low priority isClassifiedBy', test('high', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'low'],
	]));

	it('medium priority implicitlyClassifiedBy does not beat low priority isClassifiedBy brand', test('low', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'medium'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'low'],
	]));

	it('low priority implicitlyClassifiedBy beats isClassifiedBy brand with no priority', test('low', [
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'low'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'no-weight'],
	]));


	it('implicitlyClassifiedBy special report and isClassifiedBy special report sub brand', test('subbrand', [
		[ConceptType.Brand, Predicate.isClassifiedBy, 'subbrand'],
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'negative'],
	]));

	it('a priority implicitlyClassifiedBy brand beats negatively priority isClassifiedBy brand', test('high', [
		[ConceptType.Topic, Predicate.about, 'decoy'],
		[ConceptType.Brand, Predicate.isClassifiedBy, 'negative'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'high'],
		[ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'low'],
	]));
});
