const logger = require('@financial-times/n-logger').default;

const relatedContent = require('../signals/related-content');
const { RIBBON_COUNT, ONWARD_COUNT, BRAND_ONWARD_COUNT } = require('../constants');
const slotsCount = { ribbon: RIBBON_COUNT, onward: ONWARD_COUNT, brandOnward: BRAND_ONWARD_COUNT };
const dedupeById = require('../lib/dedupe-by-id');

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
		const relatedContentItems = await relatedContent(res.locals.content, { locals: Object.assign({}, res.locals) });
		padIncompletedSlots(res.locals.slots, recommendations, relatedContentItems);
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
