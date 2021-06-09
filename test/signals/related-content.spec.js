const chai = require('chai');
const expect = chai.expect;
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire');
const counts = require('../../server/constants');
const { ConceptType, Predicate } = require('../../server/lib/content');

const sinon = require('sinon');

const annotation = (id, type, predicate) => ({
	id: id === undefined ? 1 : id,
	directType: type || ConceptType.Topic,
	predicate: predicate || Predicate.about,
});

describe('related-content signal', () => {
	let subject;

	let getMostRelatedConcepts = sinon.stub();
	let getRelatedContent = sinon.stub();
	let getBrandConcept = sinon.stub();

	beforeEach(() => {
		getMostRelatedConcepts = sinon.stub();
		getMostRelatedConcepts.returns([
			annotation(0, ConceptType.Topic, Predicate.about)
		]);

		getRelatedContent = sinon.stub();
		getRelatedContent.resolves({
			concept: annotation(0, ConceptType.Topic, Predicate.about),
			items: [{id: 1}]
		});
		subject = proxyquire('../../server/signals/related-content', {
			'../lib/get-most-related-concepts': getMostRelatedConcepts,
			'../lib/get-related-content': getRelatedContent,
			'../lib/get-brand-concept': getBrandConcept,
		});
	});

	context('onward slot', () => {

		it('use get-most-related-concepts to pick concepts', () => {
			const content = {
				id: 'parent-id',
			};
			const slots = {onward: true};

			const promise = subject(content, {locals: {slots}});
			return promise.then(() => {
				expect(getMostRelatedConcepts).calledWith({
					id: content.id,
				});
			});
		});

		it('return empty object if no concepts available', () => {
			const content = {id: 'parent-id'};
			const slots = {onward: true};
			getMostRelatedConcepts.returns(undefined);
			const promise = subject(content, {locals: {slots}});
			return expect(promise).to.eventually.eql({});
		});

		it('use get-related-content to fetch content', () => {
			const content = {id: 'parent-id'};
			const slots = {onward: true};

			getMostRelatedConcepts.returns([
				annotation('concept-id')
			]);

			const promise = subject(content, {locals: {slots}});
			return promise.then(() => {
				expect(getRelatedContent.getCall(0).args[0].id).to.equal('concept-id');
				expect(getRelatedContent.getCall(0).args[2]).to.equal('parent-id');
			});
		});

		it('return empty object if there is an error fetching content', () => {
			const concept = annotation(0, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [concept] };
			const slots = {onward: true};
			getMostRelatedConcepts.returns([concept]);
			// Get related content doesn't throw, it resolves to array when error
			getRelatedContent.resolves([]);
			const promise = subject(content, {locals: {slots}});
			return expect(promise).to.eventually.eql({});
		});

		it('don\'t show if no teasers', () => {
			const concept = annotation(0, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [concept] };
			const slots = {onward: true};
			getMostRelatedConcepts.returns([concept]);
			getRelatedContent.resolves({
				concept,
				items: []
			});
			const promise = subject(content, {locals: {slots}});
			return expect(promise).to.eventually.eql({});
		});

	});

	context('ribbon slot', () => {

		it('return empty object if no concepts available', () => {
			const content = {id: 'parent-id'};
			const slots = {ribbon: true};
			getMostRelatedConcepts.returns(undefined);
			const promise = subject(content, {locals: {slots}});
			return expect(promise).to.eventually.eql({});
		});


		it('show correct number of stories', () => {
			const concept = annotation('concept-id', ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [concept] };
			const slots = {ribbon: true};
			getRelatedContent.resolves({
				concept,
				items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]
			});
			const promise = subject(content, {locals: {slots}});
			return promise.then(result => {
				expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4 ]);
			});
		});

		it('use brand stories when flag onwardJourneyTests=variant1 ', () => {
			const concept = annotation(0, ConceptType.Brand, Predicate.isClassifiedBy);
			const content = { id: 'parent-id', annotations: [concept] };
			const slots = {ribbon: true};
			const flags = {onwardJourneyTests: 'variant1'};

			getRelatedContent.resolves({
				concept,
				items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4 ]);
			});
		});

		it('don\'t show if no teasers', () => {
			const concept = annotation(0, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [concept] };
			const slots = {ribbon: true};
			getMostRelatedConcepts.returns([concept]);
			getRelatedContent.resolves({
				concept,
				items: []
			});
			const promise = subject(content, {locals: {slots}});
			return expect(promise).to.eventually.eql({});
		});
	});

	context('onward2 slot', () => {
		it('doesn\`t return onward2 slot if onwardJourneyTests flag is off', () => {
			const brand = annotation(0, ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation(1, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id' };
			const slots = {onward: true, onward2: true, ribbon: true};
			const flags = {};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.resolves({
				concept: topic,
				items: [{ id: 1 }]
			});

			// This call should never happen, but set up the stub anyway
			// to force the code to go the normal path
			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [{ id: 101 }]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				expect(getRelatedContent).to.have.been.calledOnce;
				expect(result).to.not.include.keys('onward2');
				expect(result).to.include.keys('onward');
				expect(result).to.include.keys('ribbon');
			});
		});

		it('doesn\`t return onward2 slot if there are no results', () => {
			const brand = annotation(0, ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation(1, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id' };
			const slots = {onward2: true, onward: false};
			const flags = {onwardJourneyTests: 'variant1'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.resolves({
				concept: topic,
				items: [{ id: 1 }]
			});

			getRelatedContent.onCall(1).resolves([]);

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				expect(result).to.not.include.keys('onward2');
				expect(result).to.not.include.keys('onward');
				expect(result).to.not.include.keys('ribbon');
			});
		});

		it('returns correct stories in slot (Variant: onwardJourneyTests=variant1)', () => {
			const brand = annotation(0, ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation(1, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true, ribbon: true};
			const flags = {onwardJourneyTests: 'variant1'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, {id: 6}]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [{ id: 101}, { id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }, {id: 106}]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				expect(result.onward2.items.length).to.equal(counts.ONWARD2_COUNT);
				expect(result.onward2.items.map(obj => obj.id)).to.eql([ 101, 102, 103, 104 ]);
				expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 101, 102, 103, 104 ]);
				expect(result.onward.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4, 5, 6]);
			});
		});

		it('returns correct stories in slot (Variant: onwardJourneyTests=variant2)', () => {
			const brand = annotation(0, ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation(1, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true, ribbon: true};
			const flags = {onwardJourneyTests: 'variant2'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, {id: 6}]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [{ id: 101}, { id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }, {id: 106}]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				expect(result.onward.items.map(obj => obj.id)).to.eql([ 101, 102, 103, 104, 105, 106]);
				expect(result.onward2.items.length).to.equal(counts.ONWARD2_COUNT);
				expect(result.onward2.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4, ]);
				expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4, ]);
			});
		});

		it('Shift stories from onward2 slot to onward slot if the latter is empty (Variant: onwardJourneyTests=variant1)', () => {
			const brand = annotation(0, ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation(1, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true};
			const flags = {onwardJourneyTests: 'variant1'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [/* Look: no items */]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [{ id: 101}, { id: 102 }, { id: 103 }, { id: 104 }]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				expect(result.onward2).to.be.undefined;
				expect(result.onward.items.map(obj => obj.id)).to.eql([ 101, 102, 103, 104]);
			});
		});

		it('Shift stories from onward2 slot to onward slot if the latter is empty (Variant: onwardJourneyTests=variant2)', () => {
			const brand = annotation(0, ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation(1, ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true};
			const flags = {onwardJourneyTests: 'variant2'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, {id: 8}, {id: 9}]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [/* Look no items */]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				expect(result.onward2).to.be.undefined;
				expect(result.onward.items.map(obj => obj.id)).to.eql([ 1, 2, 3, 4, 5, 6, 7, 8 ]);
			});
		});

		it('removes duplicate content when branded content in onward2 slot', () => {
			const brand = annotation('brand-id', ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation('topic-id', ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true, ribbon: true};
			const flags = {onwardJourneyTests: 'variant1'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [{ id: 1 }, { id: 2 }, { id: 'duplicate' }, { id: 4 }, { id: 5 }, { id: 6 }]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [{ id: 'duplicate'}, { id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }, { id: 106 }]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				// duplicates are not removed from the ribbon
				expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 'duplicate', 102, 103, 104 ], 'Duplicates should not be removed from the ribbon slot');
				expect(result.onward.items.map(obj => obj.id)).to.eql([ 1, 2, 'duplicate', 4, 5, 6], 'Duplicates should not be removed from the onward slot');
				// duplicates are only removed from onward 2
				expect(result.onward2.items.length).to.equal(counts.ONWARD2_COUNT, 'onward2 slot should have the correct number of items after duplicates are removed');
				expect(result.onward2.items.map(obj => obj.id)).to.eql([ 102, 103, 104, 105 ], 'Duplicates should be removed from the onward2 slot');
			});
		});

		it('removes duplicate content when topic content in onward2 slot', () => {
			const brand = annotation('brand-id', ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation('topic-id', ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true, ribbon: true};
			const flags = {onwardJourneyTests: 'variant2'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [{ id: 1 }, { id: 2 }, { id: 'duplicate' }, { id: 4 }, { id: 5 }, { id: 6 }]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [{ id: 'duplicate'}, { id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }, { id: 106 }]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				// duplicates are not removed from the ribbon
				expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 1, 2, 'duplicate', 4 ], 'Duplicates should not be removed from the ribbon slot');
				expect(result.onward.items.map(obj => obj.id)).to.eql(['duplicate', 102, 103, 104, 105, 106], 'Duplicates should not be removed from the onward slot');
				// duplicates are only removed from onward 2
				expect(result.onward2.items.length).to.equal(counts.ONWARD2_COUNT, 'onward2 slot should have the correct number of items after duplicates are removed');
				expect(result.onward2.items.map(obj => obj.id)).to.eql([ 1, 2, 4, 5 ], 'Duplicates should be removed from the onward2 slot');
			});
		});

		it('does not unnecessarily remove duplicate content (Variant: onwardJourneyTests=variant2)', () => {
			const brand = annotation('brand-id', ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation('topic-id', ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true, ribbon: true};
			const flags = {onwardJourneyTests: 'variant2'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [
					{ id: 'duplicate' }, { id: 2 }, { id: 3 }, { id: 4 },
					{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9}
				]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [
					{ id: 101}, { id: 102 }, { id: 103 }, { id: 104 },
					{ id: 105 }, { id: 106 }, { id: 107 }, { id: 108 }, { id: 'duplicate' }
				]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				// duplicates are not removed from the ribbon
				expect(result.ribbon.items.map(obj => obj.id)).to.eql([ 'duplicate', 2, 3, 4 ], 'Duplicates should not be removed from the ribbon slot');
				expect(result.onward.items.map(obj => obj.id)).to.eql([101, 102, 103, 104, 105, 106, 107, 108], 'Duplicates should not be removed from the onward slot');
				// duplicates are not removed from onward 2
				expect(result.onward2.items.map(obj => obj.id)).to.eql([ 'duplicate', 2, 3, 4 ],
					'Nothing is removed from the onward2 slot because the index of the duplicate in the onward slot greater than the max number of items'
				);
			});
		});

		it('does not unnecessarily remove duplicate content (Variant:onwardJourneyTests=variant1)', () => {
			const brand = annotation('brand-id', ConceptType.Brand, Predicate.isClassifiedBy);
			const topic = annotation('topic-id', ConceptType.Topic, Predicate.about);
			const content = { id: 'parent-id', annotations: [brand, topic] };
			const slots = {onward: true, onward2: true, ribbon: true};
			const flags = {onwardJourneyTests: 'variant1'};

			getMostRelatedConcepts.returns([topic]);
			getBrandConcept.returns(brand);

			getRelatedContent.onCall(0).resolves({
				concept: topic,
				items: [
					{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },
					{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 'duplicate'}
				]
			});

			getRelatedContent.onCall(1).resolves({
				concept: brand,
				items: [
					{ id: 'duplicate'}, { id: 102 }, { id: 103 }, { id: 104 },
					{ id: 105 }, { id: 106 }, { id: 107 }, { id: 108 }, { id: 109 }
				]
			});

			const promise = subject(content, {locals: {slots, flags}});
			return promise.then(result => {
				// duplicates are not removed from the ribbon
				expect(result.ribbon.items.map(obj => obj.id)).to.eql(['duplicate', 102, 103, 104], 'Duplicates should not be removed from the ribbon slot');
				expect(result.onward.items.map(obj => obj.id)).to.eql([1, 2, 3, 4, 5, 6, 7, 8], 'Duplicates should not be removed from the onward slot');
				// duplicates are not removed from onward 2
				expect(result.onward2.items.map(obj => obj.id)).to.eql(['duplicate', 102, 103, 104],
					'Nothing is removed from the onward2 slot because the index of the duplicate in the onward slot greater than the max number of items'
				);
			});
		});
	});
});
