module.exports = content => {
	if (!content.annotations) {
		return undefined;
	}

	const displayTag = content.displayConcept && content.displayConcept.isDisplayTag ? content.displayConcept : null;

	const mostRelatedConcepts = [
		displayTag,
		content.annotations.find(annotation => annotation.predicate === 'http://www.ft.com/ontology/annotation/about'),
		content.annotations.find(annotation => annotation.predicate === 'http://www.ft.com/ontology/classification/isPrimarilyClassifiedBy')
	]
		.filter(concept => !!concept);

	if (mostRelatedConcepts.length < 2) {
		if(content.brandConcept && !mostRelatedConcepts.find(concept => concept.id === content.brandConcept.id)) {
			mostRelatedConcepts.push(content.brandConcept);
		}
	}
	return mostRelatedConcepts.length ? mostRelatedConcepts : undefined;
};
