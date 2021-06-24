function canShowRibbonOnPage (content) {
	if (content.topper && content.topper.layout) {
		return false;
	}

	if (Array.isArray(content.containedIn) && content.containedIn.length) {
		return false;
	}

	return true;
}

function canShowBottomSlotOnPage (content) {
	if (Array.isArray(content.containedIn) && content.containedIn.length) {
		return false;
	}

	return true;
}

module.exports = {
	canShowBottomSlotOnPage,
	canShowRibbonOnPage,
};
