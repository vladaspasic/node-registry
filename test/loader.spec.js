var chai = require('chai'),
	loader = require('../lib/loader'),
	Module = require('../lib/module');

var assert = chai.assert,
	expect = chai.expect;

describe('Loader specs', function() {

	describe('#readModules', function() {
		
		it('should read test module', function(done) {
			loader.readModules(__dirname + '/modules', done);
		});

		it('should throw module not found error', function(done) {
			loader.readModules('/non-existing-dir', function(err) {
				if(err){
					assert.equal(err.message, 'Folder /non-existing-dir does not exist.');
					return done(null, err);
				}

				return done(new Error('Error not thrown'));
			});
		});

	});

	describe('#loadModules', function() {

		var testingModule = Module.extend(require('./modules/testing'));
		var neededModule = Module.extend(require('./modules/needed'));
		var dbModule = Module.extend(require('./modules/db'));

		var modules = [new dbModule('db'), new testingModule('test'), new neededModule('needed')];

		it('should load test module', function(done) {
			loader.loadModules(modules, done);
		});

		it('should throw a missing module exception', function(done) {

			modules.unshift({needs: 'missing', name: 'failing'});

			loader.loadModules(modules, function(error) {
				if(error) {
					assert.equal(error.message, "Error loading needed module: missing for module failing");
					return done(null, error);
				}

				return done(new Error('Error not thrown'));
			});

		});

	});

	describe('#executeModuleInitialization', function() {

		var module = {
			name: 'lyfecycleTest',
			onBeforeLoad: function(cb) {
				return cb(null);
			},
			load: function(data, cb) {
				return cb(null, {loaded: 'loaded'});
			},
			onAfterLoad: function(data, cb) {
				if(data.loaded) {
					data.after = 'after';
						return cb(null, data);
				} else cb(new Error('No loaded value present'));
			}
		};

		it('should execute lyfecycle methods', function(done) {

			loader.executeModuleInitialization(module, function(err, data) {
				expect(data).to.have.property('value');
				expect(data).to.have.property('module');

				assert.equal(data.value.loaded, 'loaded');
				assert.equal(data.value.after, 'after');

				return done(err, data);
			});
		});

		it('should throw lyfecycle error because loaded value is not present', function(done) {
			module.load = function(opts, cb) {
				return cb(null);
			};

			loader.executeModuleInitialization(module, function(err, data) {
				if(err) {
					assert.equal(err.message, "No loaded value present");
					return done(null, err);
				}

				return done(new Error('Error not thrown'));
			});
		});
		

	});

	describe('#initialize', function(done) {

		it('should load all modules from the directory', function(done) {
			loader.initialize({
				location: __dirname + '/modules'
			}, done);
		});

		it('should load children modules', function(done) {
			loader.initialize({
				location: __dirname + '/modules'
			}, function(err, modules) {

				var children = modules['parent'].module.getChildren();

				expect(children).to.have.property('child-one');
				expect(children).to.have.property('child-two');

				return done(err, modules);
			});
		});
		
	});

});