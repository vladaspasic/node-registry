/* global describe, beforeEach, afterEach, it */
var chai = require('chai'),
	container = require('./mocks/container'),
	loader = require('../lib/registry/loader');

var assert = chai.assert,
	expect = chai.expect;

var registry;

describe('Loader specs', function() {

	beforeEach(function() {
		registry = {
			inits: [],
			__container: container,
			registerModule: function(name, module, options) {
				container.register(name, module, options);
			},
			registerInitializer: function(init) {
				registry.inits.push(init);
			}
		};
	});

	describe('#scanDirectoryForModules', function() {

		it('should load all modules', function() {
			var list = loader.scanDirectoryForModules(registry, __dirname + '/modules');

			expect(list).to.have.length(8);
			assert.ok(registry.__container.data['db']);
			assert.ok(registry.__container.data['parent']);
			assert.ok(registry.__container.data['needed']);

		});

		it('should load all modules and initializers', function() {
			var list = loader.scanDirectoryForModules(registry, __dirname + '/modules');

			expect(list).to.have.length(8);
			expect(registry.inits).to.have.length(1);

		});

		it('should throw bad location error', function() {
			var bad = function() {
				return loader.scanDirectoryForModules(registry, './modules');
			};

			expect(bad).to.throw(Error, "Folder 'modules' does not exist.");
		});

	});

	describe('#loadModuleFactory', function() {
		it('should find module factory class', function() {
			var factory = loader.loadModuleFactory(__dirname + '/modules', 'db');

			expect(factory).to.have.property('name').and.equal('db');

		});

		it('should throw error for unknown module', function() {
			var bad = function() {
				return loader.loadModuleFactory(__dirname + '/mocks', 'module.js');
			};

			expect(bad).to.throw(TypeError, /Can not load module 'module.js'/);
		});

	});

	afterEach(function() {
		registry = null;
	});

});