var chai = require('chai'),
	container = require('./mocks/container'),
	loader = require('../lib/registry/loader');

var assert = chai.assert,
	expect = chai.expect;

describe('Loader specs', function() {

	describe('#scanDirectoryForModules', function() {

		it('should load all modules', function() {
			var list = loader.scanDirectoryForModules(container, __dirname + '/modules');

			expect(list).to.have.length(6);

		});

		it('should throw bad location error', function() {
			var bad = function() {
				return loader.scanDirectoryForModules(container, './modules');
			};

			expect(bad).to.throw(Error, "Folder 'modules' does not exist.");
		});

	});

	describe('#loadModuleFactory', function() {

		it('should load module factory class', function() {

			var factory = loader.loadModuleFactory(__dirname + '/modules', 'db');

			expect(factory).to.have.property('create');
			expect(factory).to.have.property('extend');

			var value = factory.create({
				newProp: 'new prop'
			});

			expect(value).to.have.property('name').and.equal('db');
			expect(value).to.have.property('newProp').and.equal('new prop');

		});

		it('should throw error for unknown module', function() {
			var bad = function() {
				return loader.loadModuleFactory(__dirname + '/mocks', 'module.js');
			};

			expect(bad).to.throw(TypeError, /Can not load module 'module.js'/);
		});

	});

});