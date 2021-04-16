module.exports = content => {
	if (!content.annotations) {
		return undefined;
	}

	const displayTag = content.displayConcept && content.displayConcept.isDisplayTag ? content.displayConcept : null;

	const mostRelatedConcepts = [
		displayTag,
		content.annotations.find(annotation => annotation.predicate === 'http://www.ft.com/ontology/annotation/about'),
		content.annotations.find(annotation => annotation.predicate === 'http://www.ft.com/ontology/classification/isPrimarilyClassifiedBy'),
		content.annotations.find(annotation => annotation.predicate === 'http://www.ft.com/ontology/implicitlyAbout'),
		content.annotations.find(
			annotation => annotation.predicate === 'http://www.ft.com/ontology/classification/isClassifiedBy'
			&& annotation.directType === 'http://www.ft.com/ontology/product/Brand'
		)
	]
		.filter(concept => !!concept);

	return mostRelatedConcepts.length ? mostRelatedConcepts : undefined;
};
