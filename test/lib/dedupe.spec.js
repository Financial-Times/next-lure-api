const { expect } = require('chai');
const { simple, advanced } = require('../../server/lib/dedupe');

describe('lib/dedupe.js', () => {

	describe('simple', () => {

		it('do not remove element when there are no duplicates', () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a', '5a'];
			const b = ['1b', '2b', '3b', '4b', '5b'];
			const [resultA, resultB] = simple(fn, a, b);
			expect(resultA).to.eql(a, 'List A');
			expect(resultB).to.eql(b, 'List B');
		});

		it('remove duplicates from second list', () => {
			const fn = value => value;
			const a = ['DUPLICATE', '2a', 'DUPLICATE', '4a', '5a'];
			const b = ['DUPLICATE', 'DUPLICATE', '3b', '4b', '5b'];
			const [resultA, resultB] = simple(fn, a, b);
			expect(resultA).to.eql(['DUPLICATE', '2a', 'DUPLICATE', '4a', '5a'], 'List A');
			expect(resultB).to.eql([/* removed */'3b', '4b', '5b'], 'List B');
		});

		it('identify duplicate with function', () => {
			const fn = obj => obj.id;
			const a = [{id: 'DUPLICATE'}, {id: '2a'}, {id: 'DUPLICATE'}, {id: '4a'}, {id: '5a'}];
			const b = [{id: 'DUPLICATE'}, {id: 'DUPLICATE'}, {id: '3b'}, {id: '4b'}, {id: '5b'}];
			const [resultA, resultB] = simple(fn, a, b);
			expect(resultA).to.eql([{id:'DUPLICATE'}, {id:'2a'}, {id:'DUPLICATE'}, {id:'4a'}, {id:'5a'}], 'List A');
			expect(resultB).to.eql([/* removed */ {id:'3b'}, {id:'4b'}, {id:'5b'}], 'List B');
		});

	});

	describe('advanced', () => {

		it('remove duplciates from second list when there is no frameSize argument', () => {
			const fn = value => value;
			const a = ['DUPLICATE-X', '2a', '3a', 'DUPLICATE-Y', '5a', '6a', 'DUPLICATE-Z', '8a'];
			const b = ['DUPLICATE-X', 'DUPLICATE-Y', 'DUPLICATE-Z', '4b', '5b', '6b', '7b', '8b'];
			const [resultA, resultB] = advanced(fn, a, b);
			expect(resultA).to.eql(['DUPLICATE-X', '2a', '3a', 'DUPLICATE-Y', '5a', '6a', 'DUPLICATE-Z', '8a'], 'List A');
			expect(resultB).to.eql(['4b', '5b', '6b', '7b', '8b'], 'List B');
		});

		it('do not remove elements when there are no duplicates and no frameSize argument', () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a'];
			const b = ['1b', '2b', '3b', '4b'];
			const [resultA, resultB] = advanced(fn, a, b);
			expect(resultA).to.eql(a), 'List A';
			expect(resultB).to.eql(b, 'List B');
		});

		it('do not remove elements when there are no duplicates', () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a'];
			const b = ['1b', '2b', '3b', '4b'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(a, 'List A');
			expect(resultB).to.eql(b, 'List B');
		});

		it('remove duplicate from second list', () => {
			const fn = value => value;
			const a = ['DUPLICATE', '2a', '3a', '4a'];
			const b = ['1b', '2b', '3b', 'DUPLICATE'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(a, 'List A');
			expect(resultB).to.eql(['1b', '2b', '3b' /* removed */], 'List B');
		});

		it('identiy function', () => {
			const fn = obj => obj.id;
			const a = [{id:'DUPLICATE-Y'}, {id:'DUPLICATE-Z'}, {id:'3a'}, {id:'4a'}];
			const b = [{id:'DUPLICATE-Z'}, {id:'DUPLICATE-Y'}, {id:'3b'}, {id:'4b'}];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql([{id:'DUPLICATE-Y'}, {id:'DUPLICATE-Z'}, {id:'3a'}, {id:'4a'}], 'List A');
			expect(resultB).to.eql([/* removed, removed */ {id:'3b'}, {id:'4b'}], 'List B');
		});

		it('remove multiple duplicates from second list', () => {
			const fn = value => value;
			const a = ['DUPLICATE-Y', 'DUPLICATE-Z', '3a', '4a'];
			const b = ['DUPLICATE-Z', 'DUPLICATE-Y', '3b', '4b'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['DUPLICATE-Y', 'DUPLICATE-Z', '3a', '4a'], 'List A');
			expect(resultB).to.eql([/* removed, removed */ '3b', '4b'], 'List B');
		});

		it('remove duplicate from first list when the duplicate is near the beginning of the second list', () => {
			const fn = value => value;

			const a = ['1a', '2a', '3a', 'DUPLICATE',];
			const b = ['DUPLICATE', '2b', '3b', '4b',];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['1a', '2a', '3a' /* removed */], 'List A');
			expect(resultB).to.eql(['DUPLICATE', '2b', '3b', '4b'], 'List B');
		});

		it('remove duplicates from both lists depending on the postion of the duplicate', () => {
			const fn = value => value;
			const a = ['DUPLICATE-Y', '2a', '3a', 'DUPLICATE-Z'];
			const b = ['DUPLICATE-Y', 'DUPLICATE-Z', '3b', '4b'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['DUPLICATE-Y', '2a', '3a', /* removed */], 'List A');
			expect(resultB).to.eql([/* removed */ 'DUPLICATE-Z', '3b', '4b'], 'List B');
		});

		it('remove duplicate from first list when its index is larger than the frameSize', () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a', '5a', 'DUPLICATE'];
			const b = ['DUPLICATE', '2b', '3b', '4b', '5b', '6b'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['1a', '2a', '3a', '4a', '5a' /* removed */], 'List A');
			expect(resultB).to.eql(['DUPLICATE', '2b', '3b', '4b', '5b', '6b'], 'List B');
		});

		it('remove duplicate from the second list when both elements are outside the frame', () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a', '5a', 'DUPLICATE'];
			const b = ['1b', '2b', '3b', '4b', '5b', 'DUPLICATE'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['1a', '2a', '3a', '4a', '5a', 'DUPLICATE'], 'List A');
			expect(resultB).to.eql(['1b', '2b', '3b', '4b', '5b' /* removed */], 'List B');
		});

		it('remove element from the second list when both elements are in the second frame', () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', 'DUPLICATE', '11a', '12a'];
			const b = ['1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b', '10b', 'DUPLICATE', '12b'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', 'DUPLICATE', '11a', '12a'], 'List A');
			expect(resultB).to.eql(['1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', '9b', '10b', /* removed */ '12b'], 'List B');
		});

		it('remove element from the first list when both elements are in the second frame but duplicate has a higher index in the first list', () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', 'DUPLICATE'];
			const b = ['1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', 'DUPLICATE', '10b', '11b', '12b'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', /* removed */], 'List A');
			expect(resultB).to.eql(['1b', '2b', '3b', '4b', '5b', '6b', '7b', '8b', 'DUPLICATE', '10b', '11b', '12b'], 'List B');
		});

		it('remove element from first list. duplicate is in third frame of first list, but in the second frame in the other list' , () => {
			const fn = value => value;
			const a = ['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', 'DUPLICATE', '11a', '12a'];
			const b = ['1b', '2b', '3b', '4b', '5b', 'DUPLICATE', '7b', '8b', '9b', '10b', '11b', '12b'];
			const frameSize = 4;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', /* removed */ '11a', '12a'], 'List A');
			expect(resultB).to.eql(['1b', '2b', '3b', '4b', '5b', 'DUPLICATE', '7b', '8b', '9b', '10b', '11b', '12b'], 'List B');
		});

		it('when frameSize=1' , () => {
			const fn = value => value;
			const a = ['1a', 'DUPLICATE-X', 'DUPLICATE-Y', '4a', 'DUPLICATE-Z', '6a', '7a', '8a'];
			const b = ['DUPLICATE-X', 'DUPLICATE-Z', '3b', 'DUPLICATE-Y', '5b', '6b', '7b', '8b'];
			const frameSize = 1;
			const [resultA, resultB] = advanced(fn, a, b, frameSize);
			expect(resultA).to.eql(['1a', /* removed */ 'DUPLICATE-Y', '4a', /* removed */ '6a', '7a', '8a'], 'List A');
			expect(resultB).to.eql(['DUPLICATE-X', 'DUPLICATE-Z', '3b', /* removed */ '5b', '6b', '7b', '8b'], 'List B');
		});

	});
});
