var chai = require('chai'),
	utils = require('../lib/utils');

var assert = chai.assert,
	expect = chai.expect;

var configLocation = __dirname + '/configs';

describe('Utils specs', function() {

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

		it('should return a null value from a setter function', function() {
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
			}, 'No source object is passed');
		});

		it('should throw type error for key', function() {
			assert.throw(function() {
				utils.get({}, 1234);
			}, 'You must pass a string argument to this function');

			assert.throw(function() {
				utils.get({}, false);
			}, 'You must pass a string argument to this function');

			assert.throw(function() {
				utils.get({}, {});
			}, 'You must pass a string argument to this function');

			assert.throw(function() {
				utils.get({}, function() {});
			}, 'You must pass a string argument to this function');
		});

	});

});