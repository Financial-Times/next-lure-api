const { expect } = require('chai');
const scoredSort = require('../../server/lib/scored-sort');

describe('scoredSort', () => {
	it('sort by descending score', () => {
		const score = string => string.length;
		const sort = scoredSort(score);
		const array = ['x', 'xxx', 'xxxx', 'xx', '', 'xxxxx', 'x'];
		const expected = ['xxxxx', 'xxxx', 'xxx', 'xx', 'x', 'x', ''];
		expect(sort(array)).to.eql(expected);
	});

	it('score is a float/number', () => {
		const score = number => number;
		const sort = scoredSort(score);
		const array = [0.1, 0.5, 0, 1, 5, -1, 2.5, 10.5, -0.5];
		const expected = [10.5, 5, 2.5, 1, 0.5, 0.1, 0, -0.5, -1];
		expect(sort(array)).to.eql(expected);
	});

	it('score objects', () => {
		const sizes = {
			large: 3,
			medium: 2,
			small: 1
		};
		const score = ({size}) => {
			return sizes[size];
		};
		const sort = scoredSort(score);
		const array = [{size: 'medium'}, {size: 'large'}, {size: 'large'}, {size: 'medium'}, {size: 'small'}];
		const expected = [{size: 'large'}, {size: 'large'}, {size: 'medium'}, {size: 'medium'}, {size: 'small'}];
		expect(sort(array)).to.eql(expected);
	});

	it('multiple scorer functions', () => {
		const sizes = {
			large: 3,
			medium: 2,
			small: 1
		};
		const scoreSize = ({size}) => sizes[size];
		const scoreAge = ({age}) => age || 0;
		const sort = scoredSort([scoreSize, scoreAge]);
		const array = [{size: 'medium', age: 0.5}, {size: 'large', age: 0.5}, {size: 'small', age: 0}, {size: 'large', age: 0}, {size: 'medium', age: 0}, {size: 'small', age: 100}];
		const expected = [{size: 'small', age: 100}, {size: 'large', age: 0.5}, {size: 'large', age: 0}, {size: 'medium', age: 0.5}, {size: 'medium', age: 0}, {size: 'small', age: 0}];
		expect(sort(array)).to.eql(expected);
	});

	it('filters elements with a score threshold', ()=> {
		const score = num => num;
		const threshold = 5;
		const sort = scoredSort(score, threshold);
		const array = [threshold, threshold - 1, threshold + 1];
		const expected = [threshold + 1, threshold];
		expect(sort(array)).to.eql(expected);
	});

	it('filters elements with a negative score threshold', ()=> {
		const score = num => num;
		const threshold = -5;
		const sort = scoredSort(score, threshold);
		const array = [threshold, threshold - 1, threshold + 1];
		const expected = [threshold + 1, threshold];
		expect(sort(array)).to.eql(expected);
	});
});
