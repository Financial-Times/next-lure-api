const logger = require('@financial-times/n-logger').default;
const { relatedContent, topStories, timeRelevantRecommendations, essentialStories } = require('../signals');

const modelIsFulfilled = (slots, model) => {
	return !Object.keys(excludeCompletedSlots(slots, model)).length
}

const excludeCompletedSlots = (slots, model) => {
	return Object.keys(slots).reduce((obj, slotName) => {
		if (!model[slotName]) {
			obj[slotName] = true;
		}
		return obj;
	}, {})
}

module.exports = async (req, res, next) => {
	try {
		let recommendations = {};

		const signalStack = [relatedContent];

		if (res.locals.flags.lureTopStories) {
			signalStack.unshift(topStories);
		}

		if (res.locals.flags.lureTimeRelevantRecommendations) {
			signalStack.unshift(timeRelevantRecommendations);
		}

		if (res.locals.flags.refererCohort === 'search'
			&& res.locals.flags.cleanOnwardJourney
			&& res.locals.content._editorialComponents.length > 0
		) {
			signalStack.unshift(essentialStories);
		}

		let signal;

		while ((signal = signalStack.shift()) && !modelIsFulfilled(res.locals.slots, recommendations)) {

			const newRecommendations = await signal(res.locals.content, { locals: Object.assign({}, res.locals, {
				slots: excludeCompletedSlots(res.locals.slots, recommendations)
			}), query: req.query});

			recommendations = Object.assign(recommendations, newRecommendations);
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
