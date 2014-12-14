var chai = require('chai'),
	Module = require('../module');

var assert = chai.assert,
	expect = chai.expect;

describe('Module', function() {

	describe('#getName', function() {

		it('should return name', function() {
			var module = Module.create({
				name: 'module'
			});

			assert.deepEqual(module.getName(), 'module');
		});

		it('should throw a TypeError', function() {
			var module = Module.create({
				name: {}
			});

			assert.throw(function() {
				module.getName();
			}, TypeError , 'Module name must be a String, you passed: object');

			module.name = 1234;

			assert.throw(function() {
				module.getName();
			}, TypeError , 'Module name must be a String, you passed: number');

			module.name = undefined;

			assert.throw(function() {
				module.getName();
			}, TypeError , 'Module name must be a String, you passed: undefined');

			module.name = true;

			assert.throw(function() {
				module.getName();
			}, TypeError , 'Module name must be a String, you passed: boolean');

			module.name = function() {};

			assert.throw(function() {
				module.getName();
			}, TypeError , 'Module name must be a String, you passed: function');
		});

	});

	describe('#getRequirements', function() {

		it('should return a list of requirements from a string', function() {
			var module = Module.create({
				requires: 'module'
			});

			assert.deepEqual(module.getRequirements(), ['module']);
		});

		it('should return a list of requirements from an array', function() {
			var module = Module.create({
				requires: ['module']
			});

			assert.deepEqual(module.getRequirements(), ['module']);
		});

		it('should return an empty list', function() {
			var module = Module.create();

			assert.deepEqual(module.getRequirements(), []);
		});

		it('should throw an TypeError', function() {
			var module = Module.create({
				requires: {}
			});

			assert.throw(function() {
				module.getRequirements();
			}, TypeError , 'Module \'requires\' property must be a String an Array');
		});

	});

});