const copy = (a,b) => [a.slice(0), b.slice(0)];

function simple (fn, a, b) {
	const [A, B] = copy(a, b);
	// Remove elements from B if they appear in A
	const ids = new Set(A.map(fn));
	return [A, B.filter(item => !ids.has(fn(item)))];
}

function advanced (fn, a, b, frameSize) {
	const [A, B] = copy(a, b);

	frameSize = frameSize ? frameSize : A.length * 10;

	const score = index => (Math.floor(index / frameSize) * frameSize) + index;
	const mapScore = (array, scoreFn) => (
		new Map(array.map((item, index) => [fn(item), scoreFn(item, index)]))
	);

	const scoresA = mapScore(A, (_, index) => score(index));
	const scoresB = mapScore(B, (_, index) => score(index) + (frameSize / 2));

	return [
		A.filter(item => {
			const key = fn(item);
			const valueB = scoresB.get(key);
			const valueA = scoresA.get(key);
			if (!Number.isFinite(valueB)) {
				return true;
			}
			return valueA < valueB;
		}),

		B.filter(item => {
			const key = fn(item);
			const valueB = scoresB.get(key);
			const valueA = scoresA.get(key);
			if (!Number.isFinite(valueA)) {
				return true;
			}
			return valueB <= valueA;
		}),
	];
}

module.exports = {
	simple,
	advanced,
};
