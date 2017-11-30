const logger = require('@financial-times/n-logger').default;
const { relatedContent, topStories, timeRelevantRecommendations, essentialStories } = require('../signals');

async function getRecommendataions (req, res, signalStack) {
	let result;
	let signal;
	while (signal = signalStack.shift()) {
		result = await signal(res.locals.content, { locals: res.locals, query: req.query });
		if (result) {
			break;
		}
	}
	return result;
};


module.exports = async (req, res, next) => {
	try {
		let recommendations;

		const signalStack = [relatedContent];
		const signalStackForOverwrite = []; // for overwirtting only rhr/ribbon or onward recommendations not both

		if (res.locals.flags.lureTopStories) {
			signalStack.unshift(topStories);
		}

		if (res.locals.flags.lureTimeRelevantRecommendations) {
			signalStack.unshift(timeRelevantRecommendations);
		}

		if (res.locals.flags.refererCohort === 'search' && res.locals.content._editorialComponents.length > 0) {
			signalStackForOverwrite.unshift(essentialStories);
		}

		recommendations = await getRecommendataions(req, res, signalStack);

		if (signalStackForOverwrite.length > 0) {
			const recommendationsForOverwrite = await getRecommendataions(req, res, signalStack);
			if (recommendationsForOverwrite) {
				return recommendations;
			}
			if (recommendationsForOverwrite.rhr) {
				recommendations.rhr = recommendationsForOverwrite.rhr
			} else if (recommendationsForOverwrite.onward) {
				recommendations.onward = recommendationsForOverwrite.onward
			}
		}

		res.locals.recommendations = recommendations;
		next();
	} catch (err) {
		logger.error({event: 'RECOMMENDATION_FAILURE', contentId: req.params.contentId}, err);

		if (/(network|response) timeout at: https:\/\/search-next-elasticsearch/.test(err.message)) {
			return res.status(504).end();
		}
		next(err);
	}
}
