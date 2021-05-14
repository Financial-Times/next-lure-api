const { expect } = require('chai');
const { withType, withGenre, withPredicate, ConceptType, Predicate } = require('../../server/lib/content');

const annotaton = (type, predicate, id) => ({
	directType: type || ConceptType.Topic,
	predicate: predicate || Predicate.about,
	id: id || '123',
});

describe('server/lib/content.js', () => {
	describe('withType', () => {
		it('type brand', () => {
			const type = ConceptType.Brand;
			const fixture = annotaton(type);
			expect(withType(type)(fixture)).to.be.true;
		});

		it('arbitrary type', () => {
			const type = 'some-type';
			const fixture = annotaton(type);
			expect(withType(type)(fixture)).to.be.true;
		});

		it('with id argument', () => {
			const type = 'some-type';
			const id = 'test-id';
			const fixture = annotaton(type, undefined, id);
			expect(withType(type, id)(fixture)).to.be.true;
		});
	});

	describe('withGenre', () => {
		it('returns true for Genre annotation', () => {
			const fixture = annotaton(ConceptType.Genre);
			expect(withGenre()(fixture)).to.be.true;
		});

		it('returns false for Topic annotation', () => {
			const fixture = annotaton(ConceptType.Topic);
			expect(withGenre()(fixture)).to.be.false;
		});

		it('returns true for Genre annotation with id', () => {
			const id = 'test-id';
			const fixture = annotaton(ConceptType.Genre, undefined, id);
			expect(withGenre(id)(fixture)).to.be.true;
		});

		it('returns false for Genre annotation with an incorrect id', () => {
			const fixture = annotaton(ConceptType.Genre, undefined, 'incorrect-id');
			expect(withGenre('correct-id')(fixture)).to.be.false;
		});
	});

	describe('withPredicate', () => {

		it('returns true for annotation with correct predicate', () => {
			const predicate = 'test-predicate';
			const fixture = annotaton(undefined, predicate);
			expect(withPredicate(predicate)(fixture)).to.be.true;
		});

		it('returns false for annotation with incorrect predicate', () => {
			const fixture = annotaton(undefined, 'incorrect-predicate');
			expect(withPredicate('correct-predicate')(fixture)).to.be.false;
		});

		it('returns true for annotation with correct predicate and type', () => {
			const type = 'test-type';
			const predicate = 'test-predicate';
			const fixture = annotaton(type, predicate);
			expect(withPredicate(predicate, type)(fixture)).to.be.true;
		});

		it('returns false for annotation with correct predicate but incorrect type', () => {
			const predicate = 'test-predicate';
			const fixture = annotaton('incorrect-type', predicate);
			expect(withPredicate(predicate, 'correct-type')(fixture)).to.be.false;
		});
	});
});
