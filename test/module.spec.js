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