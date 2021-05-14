const { expect } = require('chai');
const proxyquire = require('proxyquire');

const newsletterId = 'newsletter';

const { withType, withGenre, withPredicate, findNewsletterBrand, ConceptType, Predicate } = proxyquire('../../server/lib/content', {
	'@financial-times/n-concept-ids': {
		genre: {
			newsletter: newsletterId,
		},
	},
});



const annotation = (type, predicate, id) => ({
	directType: type || ConceptType.Topic,
	predicate: predicate || Predicate.about,
	id: id || '123',
});

describe('server/lib/content.js', () => {
	describe('withType', () => {
		it('type brand', () => {
			const type = ConceptType.Brand;
			const fixture = annotation(type);
			expect(withType(type)(fixture)).to.be.true;
		});

		it('arbitrary type', () => {
			const type = 'some-type';
			const fixture = annotation(type);
			expect(withType(type)(fixture)).to.be.true;
		});

		it('with id argument', () => {
			const type = 'some-type';
			const id = 'test-id';
			const fixture = annotation(type, undefined, id);
			expect(withType(type, id)(fixture)).to.be.true;
		});
	});

	describe('withGenre', () => {
		it('returns true for Genre annotation', () => {
			const fixture = annotation(ConceptType.Genre);
			expect(withGenre()(fixture)).to.be.true;
		});

		it('returns false for Topic annotation', () => {
			const fixture = annotation(ConceptType.Topic);
			expect(withGenre()(fixture)).to.be.false;
		});

		it('returns true for Genre annotation with id', () => {
			const id = 'test-id';
			const fixture = annotation(ConceptType.Genre, undefined, id);
			expect(withGenre(id)(fixture)).to.be.true;
		});

		it('returns false for Genre annotation with an incorrect id', () => {
			const fixture = annotation(ConceptType.Genre, undefined, 'incorrect-id');
			expect(withGenre('correct-id')(fixture)).to.be.false;
		});
	});

	describe('withPredicate', () => {

		it('returns true for annotation with correct predicate', () => {
			const predicate = 'test-predicate';
			const fixture = annotation(undefined, predicate);
			expect(withPredicate(predicate)(fixture)).to.be.true;
		});

		it('returns false for annotation with incorrect predicate', () => {
			const fixture = annotation(undefined, 'incorrect-predicate');
			expect(withPredicate('correct-predicate')(fixture)).to.be.false;
		});

		it('returns true for annotation with correct predicate and type', () => {
			const type = 'test-type';
			const predicate = 'test-predicate';
			const fixture = annotation(type, predicate);
			expect(withPredicate(predicate, type)(fixture)).to.be.true;
		});

		it('returns false for annotation with correct predicate but incorrect type', () => {
			const predicate = 'test-predicate';
			const fixture = annotation('incorrect-type', predicate);
			expect(withPredicate(predicate, 'correct-type')(fixture)).to.be.false;
		});
	});

	describe('findNewsletterBrand', () => {

		it('returns the brand when the content is a newsletter', () => {
			const fixture = {
				annotations: [
					annotation(ConceptType.Genre, Predicate.isClassifiedBy, newsletterId),
					annotation(ConceptType.Brand, Predicate.isClassifiedBy, 'brand-id'),
				],
			};
			const result = findNewsletterBrand(fixture);
			expect(result).to.include({id: 'brand-id'});
		});

		it('returns the correct brand when the content is a newsletter', () => {
			const fixture = {
				annotations: [
					annotation(ConceptType.Genre, Predicate.isClassifiedBy, newsletterId),
					annotation(ConceptType.Brand, Predicate.implicitlyClassifiedBy, 'incorrect-brand-id'),
					annotation(ConceptType.Brand, Predicate.isClassifiedBy, 'brand-id'),
				],
			};
			expect(findNewsletterBrand(fixture)).to.include({id: 'brand-id'});
		});

		it('returns undefined when no brand is present for newsletter content', () => {
			const fixture = {
				annotations: [
					annotation(ConceptType.Genre, Predicate.isClassifiedBy, newsletterId),
					annotation(ConceptType.Topic, Predicate.about, 'topic-id'),
				],
			};
			expect(findNewsletterBrand(fixture)).to.be.undefined;
		});

		it('returns undefined when content is not a newsletter', () => {
			const fixture = {
				annotations: [
					annotation(ConceptType.Topic, Predicate.about, 'topic-id'),
					annotation(ConceptType.Genre, Predicate.isClassifiedBy, 'genre-id'),
					annotation(ConceptType.Brand, Predicate.isClassifiedBy, 'brand-id'),
				],
			};
			expect(findNewsletterBrand(fixture)).to.be.undefined;
		});

		it('returns undefined when content has no annotations', () => {
			const fixture = {
				annotations: undefined,
			};
			expect(findNewsletterBrand(fixture)).to.be.undefined;
		});

	});
});
