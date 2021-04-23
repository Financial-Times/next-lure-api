module.exports = content => {
	if (!content.annotations) {
		return undefined;
	}

	const brandConcept = content.annotations.find(annotation => annotation.directType === 'http://www.ft.com/ontology/product/Brand');

	// ToDo: Some kind of predicate sorting.

	return brandConcept || undefined;
};
