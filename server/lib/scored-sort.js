const descending = (a, b) => b - a;

function reducer (functions) {
	return element => (
		functions.reduce((total, fn) => {
			const score = fn(element) || 0;
			if (score === true) {
				return total + 1;
			}
			if (!Number.isFinite(score)) {
				return total;
			}
			return total + score;
		}, 0)
	);
}

function scoredSort (score, threshold = -Infinity) {
	score = Array.isArray(score) ? reducer(score) : score;
	return array => (
		array
			.map(element => [score(element), element])
			.filter(([score]) => score >= threshold)
			.sort(([a], [b]) => descending(a, b))
			.map(([, element]) => element)
	);
}

module.exports = scoredSort;
