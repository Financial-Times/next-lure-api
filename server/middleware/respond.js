const dedupeById = require('../lib/dedupe-by-id');
const send404 = require('../lib/send-404');

const finishModel = (model, listName, count) => {
	const listObj = {};

	listObj[listName] = model.items.slice(0, count);

	if (!model.concept) {
		return Object.assign({}, {
			title: model.title,
			titleHref: model.titleHref
		}, listObj);
	}

	return Object.assign({}, {
		title: `Latest ${model.concept.preposition} ${model.concept.prefLabel}`,
		titleHref: model.concept.relativeUrl,
		concept: model.concept
	}, listObj);
};

module.exports = (req, res) => {
	if (!res.locals.recommendations || !Object.keys(res.locals.recommendations).length) {
		return send404(res);
	}
	const { recommendations, modelTemplate: {listName, onward, ribbon, rhr} } = res.locals;
	const response = {};

	if (recommendations.ribbon) {
		const ribbonModel = finishModel(recommendations.ribbon, listName, rhr || ribbon);
		if (ribbon) {
			response.ribbon = ribbonModel;
		} else {
			response.rhr = ribbonModel;
		}
	}

	if (recommendations.onward) {

		if (!Array.isArray(onward)) {
			response.onward = finishModel(recommendations.onward, listName, onward);

		} else {

			const onwardAsArray = Array.isArray(recommendations.onward) ? recommendations.onward : [recommendations.onward];
			response.onward = [
				finishModel(onwardAsArray[0], listName, onward[0])
			];

			let secondOnward;

			if (onwardAsArray[1]) {
				secondOnward = Object.assign({}, onwardAsArray[1], {
					items: dedupeById(onwardAsArray[1].items, response.onward[0][listName])
				})
			} else {
				// deliberately no title
				secondOnward = Object.assign({}, {
					items: onwardAsArray[0].items.slice(onward[0])
				})
			}
			response.onward.push(finishModel(secondOnward, listName, onward[1]));

		}
	}

	res.json(response);
};
