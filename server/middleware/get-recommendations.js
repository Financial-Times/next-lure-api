const logger = require('@financial-times/n-logger').default;
const { metrics } = require('@financial-times/n-express');

const {
	relatedContent,
	essentialStories
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

const	padIncompletedSlots = (slots, model, paddingItems) => {
	Object.keys(slots).forEach((slotName) => {
		if (!model[slotName]) {
			model[slotName] = paddingItems[slotName];
		} else {
			const isShortOfItems = model[slotName] && (model[slotName].items.length < slotsCount[slotName]) ? true : false;
			if (isShortOfItems) {
				if (model[slotName].items.length < slotsCount[slotName]/2) {
					model[slotName].title = paddingItems[slotName].title;
					model[slotName].titleHref = paddingItems[slotName].titleHref;
					model[slotName].concept = paddingItems[slotName].concept;
				}
				const combinedItems = model[slotName].items.concat(paddingItems[slotName].items);
				model[slotName].items = dedupeById(combinedItems).slice(0, slotsCount[slotName]);
			}
		}
	});
};

module.exports = async (req, res, next) => {
	try {
		let recommendations = {};

		const signalStack = [];

		if (res.locals.flags.refererCohort === 'search'
			&& res.locals.content._editorialComponents
			&& res.locals.content._editorialComponents.length > 0
		) {
			signalStack.push(essentialStories);
			metrics.count('signals.essentialStories');
		}

		let signal;

		while ((signal = signalStack.shift()) && !modelIsFulfilled(res.locals.slots, recommendations)) {
			const newRecommendations = await signal(res.locals.content, { locals: Object.assign({}, res.locals, {
				slots: excludeCompletedSlots(res.locals.slots, recommendations)
			}), query: req.query});
			recommendations = Object.assign(recommendations, newRecommendations);
		}

		const needPadding = Object.keys(res.locals.slots).map(slotName => {
			const isSlotNotExist = !recommendations[slotName] ? true : false;
			const isShortOfItems = !isSlotNotExist && recommendations[slotName].items.length < slotsCount[slotName] ? true : false;
			return isSlotNotExist || isShortOfItems;
		}).includes(true);

		metrics.count(`signals.needPadding.${needPadding}`);

		if (needPadding) {
			const paddingItems = await relatedContent(res.locals.content, { locals: Object.assign({}, res.locals) });
			padIncompletedSlots(res.locals.slots, recommendations, paddingItems);
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
