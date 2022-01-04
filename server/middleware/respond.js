const { metrics } = require('@financial-times/n-express');
const createError = require('http-errors');

const finishModel = (model, defaultTitleIntro) => {
	const listObj = {};
	listObj.items = model.items ? model.items.slice() : [];
	if (!model.concept) {
		return Object.assign({}, {
			title: model.title,
			titleHref: model.titleHref,
			contentSelection: model.contentSelection,
		}, listObj);
	}

	return Object.assign({}, {
		title:  model.title || `${defaultTitleIntro} ${model.concept.preposition} ${model.concept.prefLabel}`,
		titleHref:  model.titleHref || model.concept.relativeUrl,
		concept: model.concept,
		contentSelection: model.contentSelection,
	}, listObj);
};

const sum = (total, value) => total + value;
const numItems = (slot) => slot && slot.items && slot.items.length || 0;

module.exports = (_, res) => {
	if (!res.locals.recommendations || !Object.keys(res.locals.recommendations).length) {
		throw new createError.NotFound();
	}

	const { recommendations, flags = {} } = res.locals;
	const response = {};

	if (recommendations.onward) {
		response.onward = finishModel(recommendations.onward, 'Latest');
	}

	if (recommendations.onward2) {
		response.onward2 = finishModel(recommendations.onward2, 'More');
	}

	const numSlots = Object.keys(response).length;
	const totalItems = Object.values(response).map(numItems).reduce(sum, 0);

	// The front-end will send this data to Spoor when the Onward Journey is displayed.
	// The front-end will also send to spoor data about which components were shown to the user.
	response._metadata = {
		flagState: {
			onwardJourneyTests: flags.onwardJourneyTests || 'control',
		},
		numSlots,
		totalItems,
		contentSelection: Object.keys(response).reduce((o, k) => {
			o[k] = response[k].contentSelection;
			return o;
		}, {}),
	};

	res.set('Cache-Control', res.FT_NO_CACHE);
	if (recommendations._noCache) {
		res.set('Surrogate-Control', res.FT_NO_CACHE);
	} else {
		res.set('Surrogate-Control', res.FT_HOUR_CACHE);
	}
	res.json(response);

	metrics.count(`flags.onwardJourneyTests.${flags.onwardJourneyTests || 'control'}`);
	metrics.count(`slots.onward.${Boolean(response.onward)}`);
	metrics.count(`slots.onward2.${Boolean(response.onward2)}`);
};
