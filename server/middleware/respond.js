const { metrics } = require('@financial-times/n-express');
const createError = require('http-errors');

const finishModel = (model, defaultTitleIntro) => {
	const listObj = {};
	listObj.items = model.items ? model.items.slice() : [];
	if (!model.concept) {
		return Object.assign({}, {
			title: model.title,
			titleHref: model.titleHref
		}, listObj);
	}

	return Object.assign({}, {
		title:  model.title || `${defaultTitleIntro} ${model.concept.preposition} ${model.concept.prefLabel}`,
		titleHref:  model.titleHref || model.concept.relativeUrl,
		concept: model.concept
	}, listObj);
};

module.exports = (_, res) => {
	if (!res.locals.recommendations || !Object.keys(res.locals.recommendations).length) {
		throw new createError.NotFound();
	}

	const { recommendations } = res.locals;
	const response = {};

	if (recommendations.ribbon) {
		response.ribbon = finishModel(recommendations.ribbon, 'Latest');
	}

	if (recommendations.onward) {
		response.onward = finishModel(recommendations.onward, 'Latest');
	}

	if (recommendations.brandOnward) {
		response.brandOnward = finishModel(recommendations.brandOnward, 'More');
	}

	res.set('Cache-Control', res.FT_NO_CACHE);
	if (recommendations._noCache) {
		res.set('Surrogate-Control', res.FT_NO_CACHE);
	} else {
		res.set('Surrogate-Control', res.FT_HOUR_CACHE);
	}
	res.json(response);

	metrics.count(`slots.ribbon.${Boolean(response.ribbon)}`);
	metrics.count(`slots.onward.${Boolean(response.onward)}`);
};
