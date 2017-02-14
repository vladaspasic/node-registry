var chai = require('chai'),
	utils = require('../lib/utils');

var assert = chai.assert,
	expect = chai.expect;

describe('Utils', function() {

	describe('#get', function() {

		it('should return "some testing value"', function() {

			expect(utils.get({
				val: "some testing value"
			}, 'val')).to.equal("some testing value");
		});

		it('should return null for unknown value', function() {
			expect(utils.get({}, 'val')).to.equal(null);
		});

		it('should return a value from a getter function', function() {

			expect(utils.get({
				val: function() {
					return "some testing value";
				}
			}, 'val')).to.equal("some testing value");
		});

		it('should return a null value from a setter function', function() {

			assert(typeof utils.get({
				val: function(prop) {
					return "some testing value";
				}
			}, 'val') === 'function');
		});

		it('should return a value from a path', function() {
			var root = {
				foo: {
					bar: 'value'
				}
			};

			var res = utils.get(root, 'foo.bar');

			assert.deepEqual(res, 'value');
		});

		it('should throw error for unknown root', function() {
			assert.throw(function() {
				utils.get();
			}, 'Cannot call get with \'undefined\' on an undefined object.');
		});

		it('should throw type error for key', function() {
			assert.throw(function() {
				utils.get({}, 1234);
			}, 'The key provided to set must be a string');

			assert.throw(function() {
				utils.get({}, false);
			}, 'The key provided to set must be a string');

			assert.throw(function() {
				utils.get({}, {});
			}, 'The key provided to set must be a string');

			assert.throw(function() {
				utils.get({}, function() {});
			}, 'The key provided to set must be a string');
		});

	});

});