const conceptIds = require('@financial-times/n-concept-ids');

const Predicate = Object.freeze({
	about: 'http://www.ft.com/ontology/annotation/about',
	isPrimarilyClassifiedBy: 'http://www.ft.com/ontology/classification/isPrimarilyClassifiedBy',
	implicitlyAbout: 'http://www.ft.com/ontology/implicitlyAbout',
	isClassifiedBy: 'http://www.ft.com/ontology/classification/isClassifiedBy',
	implicitlyClassifiedBy: 'http://www.ft.com/ontology/implicitlyClassifiedBy',
});

const ConceptType = Object.freeze({
	Brand: 'http://www.ft.com/ontology/product/Brand',
	Genre: 'http://www.ft.com/ontology/product/Genre',
	Organisation: 'http://www.ft.com/ontology/organisation/Organisation',
	Location: 'http://www.ft.com/ontology/Location',
	Topic: 'http://www.ft.com/ontology/Topic',
});

function withType (type, id) {
	const checkType = annotation => annotation.directType === type;
	if (id) {
		return annotation => checkType(annotation) && annotation.id === id;
	}
	return checkType;
}

function withGenre (id) {
	return withType(ConceptType.Genre, id);
}

function withPredicate (predicate, type) {
	const checkPredicate = annotation => annotation.predicate === predicate;
	if (type) {
		return annotation => checkPredicate(annotation) && withType(type)(annotation);
	}
	return checkPredicate;
}

function findNewsletterBrand (content) {
	if (!content.annotations) {
		return;
	}

	const isNewsletter = Boolean(content.annotations.find(({id}) => id === conceptIds.genre.newsletter));

	if (!isNewsletter) {
		return;
	}

	return content.annotations.find(withPredicate(Predicate.isClassifiedBy, ConceptType.Brand));
}

module.exports = {
	ConceptType,
	Predicate,
	withPredicate,
	withGenre,
	withType,
	findNewsletterBrand,
};
