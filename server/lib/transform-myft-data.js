const followedConcept = (article, concept = {}) => {
	const followedConcept = Object.assign({}, concept);
	delete followedConcept.latestContent;
	article.followedConcept = followedConcept;

	return article;
};

const removeEmptyConcepts = concept => Boolean(concept.latestContent && concept.latestContent.length);

const flattenConceptsToArticles = (articles, concept) => articles.concat(concept.latestContent);

const removeDuplicateArticles = (articles, article) => {
	const alreadyContainsArticle = articles.find(item => item.id === article.id);

	return alreadyContainsArticle ? articles : articles.concat(article);
};

const orderByDate = (articleOne, articleTwo) => new Date(articleTwo.publishedDate) - new Date(articleOne.publishedDate);

const extractArticlesFromConcepts = (data) => {

	if (!data.followsConcepts) {
		return data;
	}

	data.followedConcepts.forEach(concept =>
		concept.latestContent = concept.latestContent
			.map((article) => {
				return followedConcept(article, concept);
			}));

	data.articles = data.followedConcepts
		.filter(removeEmptyConcepts)
		.reduce(flattenConceptsToArticles, [])
		.reduce(removeDuplicateArticles, [])
		.sort(orderByDate);

	delete data.followedConcepts;

	return data;

};

const doesUserFollowConcepts = (followedConcepts) => {
	return {
		followsConcepts: Boolean(followedConcepts.length),
		followedConcepts
	};
};


module.exports = {
	doesUserFollowConcepts,
	extractArticlesFromConcepts
};
