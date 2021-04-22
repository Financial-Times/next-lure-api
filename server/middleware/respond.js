const { metrics } = require('@financial-times/n-express');
const send404 = require('../lib/send-404');

const finishModel = (model) => {
	const listObj = {};

	listObj.items = model.items.slice();

	if (!model.concept) {
		return Object.assign({}, {
			title: model.title,
			titleHref: model.titleHref
		}, listObj);
	}

	return Object.assign({}, {
		title:  model.title || `Latest ${model.concept.preposition} ${model.concept.prefLabel}`,
		titleHref:  model.titleHref || model.concept.relativeUrl,
		concept: model.concept
	}, listObj);
};

module.exports = (req, res) => {
	if (!res.locals.recommendations || !Object.keys(res.locals.recommendations).length) {
		return send404(res);
	}

	const { recommendations } = res.locals;
	const response = {};

	if (recommendations.ribbon) {
		response.ribbon = finishModel(recommendations.ribbon);
	}

	if (recommendations.onward) {
		response.onward = finishModel(recommendations.onward);
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
