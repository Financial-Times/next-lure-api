function canShowBottomSlotOnPage (content) {
	if (Array.isArray(content.containedIn) && content.containedIn.length) {
		return false;
	}

	return true;
}

module.exports = {
	canShowBottomSlotOnPage,
};
