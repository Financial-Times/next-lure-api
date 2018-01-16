const logger = require('@financial-times/n-logger').default;
const {
	relatedContent,
	essentialStories,
	myFtRecommendations,
	ftRexRecommendations
} = require('../signals');
const { RIBBON_COUNT, ONWARD_COUNT } = require('../constants');
const slotsCount = { ribbon: RIBBON_COUNT, onward: ONWARD_COUNT };
const dedupeById = require('../lib/dedupe-by-id');

const modelIsFulfilled = (slots, model) => {
	return !Object.keys(excludeCompletedSlots(slots, model)).length;
};

const excludeCompletedSlots = (slots, model) => {
	return Object.keys(slots).reduce((obj, slotName) => {
		if (!model[slotName]) {
			obj[slotName] = true;
		}
		return obj;
	}, {});
};

const	padIncompletedSlots = (slots, paddingItems, model, isLastSignal) => {
	Object.keys(slots).forEach((slotName) => {
		if (isLastSignal && !model[slotName]) {
			model[slotName] = paddingItems[slotName];
		} else {
			const shortOfItems = model[slotName] ? slotsCount[slotName] - model[slotName].items.length : false;
			if (shortOfItems) {
				if (model[slotName].items.length < slotsCount[slotName]/2) {
					model[slotName].title = paddingItems[slotName].title;
					model[slotName].titleHref = paddingItems[slotName].titleHref;
					model[slotName].concept = paddingItems[slotName].concept;
				}
				model[slotName].items = dedupeById(model[slotName].items, paddingItems[slotName].items).slice(0, slotsCount[slotName]);
			}
		}
	});
};

module.exports = async (req, res, next) => {
	try {
		let recommendations = {};

		const signalStack = [];

		if (res.locals.flags.refererCohort === 'search'
			&& res.locals.flags.cleanOnwardJourney
			&& res.locals.content._editorialComponents
			&& res.locals.content._editorialComponents.length > 0
		) {
			signalStack.push(essentialStories);
		}

		if (res.locals.flags.lureFtRexRecommendations) {
			signalStack.push(ftRexRecommendations);
		}

		//TODO place correctly following the recommendations' priority
		if (res.locals.flags.myFtApi
			&& res.locals.flags.lureMyFtRecommendations
		) {
			signalStack.push(myFtRecommendations);
		}

		const paddingItems = await relatedContent(res.locals.content, { locals: Object.assign({}, res.locals) });

		let signal;

		while ((signal = signalStack.shift()) && !modelIsFulfilled(res.locals.slots, recommendations)) {
			const newRecommendations = await signal(res.locals.content, { locals: Object.assign({}, res.locals, {
				slots: excludeCompletedSlots(res.locals.slots, recommendations)
			}), query: req.query});
			const isLastSignal = signalStack.length ? true : false;
			padIncompletedSlots(res.locals.slots, paddingItems, newRecommendations, isLastSignal);
			recommendations = Object.assign(recommendations, newRecommendations);
		}

		res.locals.recommendations = recommendations;
		next();
	} catch (err) {
		logger.error({event: 'RECOMMENDATION_FAILURE', contentId: req.params.contentId}, err);

		if (err.httpStatus) {
			return res.status(err.httpStatus).json({ message: err.message }).end();
		}

		if (/(network|response) timeout at: https:\/\/search-next-elasticsearch/.test(err.message)) {
			return res.status(504).end();
		}
		next(err);
	}
};
