var chai = require('chai'),
	http = require('http'),
	utils = require('./utils'),
	Registry = require('../lib');

var options = {
	location: __dirname + '/modules'
};

var assert = chai.assert,
	expect = chai.expect,
	port = 1234;

var get = function(name) {
	return Registry.get(name);
};

describe('Registry spec', function() {

	it('should be able to construct an Object with new', function() {
		var Ctor = Registry.Object.extend({
			init: function(ctorProperty) {
				this.ctorProperty = ctorProperty;
			},
			method: function() {
				return this.ctorProperty;
			},
			property: 'property'
		}, {
			staticProperty: 'staticProperty'
		});

		assert.doesNotThrow(function() {
			var ctor = new Ctor('ctorProperty');

			assert.deepEqual(ctor.property, 'property');
			assert.deepEqual(ctor.staticProperty, 'staticProperty');
			assert.deepEqual(ctor.ctorProperty, 'ctorProperty');
			assert.deepEqual(ctor.method(), 'ctorProperty');
		});
	});

	describe('#get', function() {
		
		it('Should return right module', function() {
			Registry.registerFolder(__dirname + '/modules');
			var db = Registry.get('db');

			expect(db).to.be.an('object');

			assert.deepEqual(db, Registry.get('db'));
		});

		it('Should throw error for missing module', function() {
			assert.throw(function() {
				Registry.get('db');
			}, "Factory with name 'db' can not be found.");
		});

	});
	
	describe('#registerModule', function() {

		it('should register module as an Object', function() {
			Registry.registerModule('module', {
				name: 'module'
			});

			var module = Registry.get('module');

			expect(module).to.have.property('name').and.equal('module');
		});

		it('should register module as a location', function() {
			Registry.registerModule('needed', __dirname + '/modules');

			var module = Registry.get('needed');

			expect(module).to.have.property('name').and.equal('needed');
		});

		it('should register module as a Module instance', function() {
			Registry.registerModule('module', Registry.Module.extend({
				name: 'module'
			}));

			var module = Registry.get('module');

			expect(module).to.have.property('name').and.equal('module');
		});

		it('should throw error because name is not a string', function() {
			assert.throw(function() {
				Registry.registerModule({});
			}, TypeError, 'Module name must be a String');
		});

		it('should throw error because injected module is not registered', function() {
			Registry.registerModule('db', __dirname + '/modules');

			assert.throw(function() {
				Registry.get('db');
			}, "Factory with name 'needed' can not be found.");
		});

	});

	describe('#registerFolder', function() {

		it('should scan the directory and register all modules', function() {
			Registry.registerFolder(__dirname + '/modules');

			expect(get('db')).to.have.property('name').and.equal('db');
			expect(get('db')).to.have.property('testing').and.equal('testing db');
			expect(get('db')).to.have.deep.property('needed.name', 'needed');
			expect(get('db')).to.have.deep.property('needed.property', 'testing needed');


			expect(get('needed')).to.be.an('object');
			expect(get('parent')).to.be.an('object');
			expect(get('testing')).to.be.an('object');
			expect(get('child-one')).to.be.an('object');
			expect(get('child-two')).to.be.an('object');
		});

		it('should scan the directory and register all modules without instantiation', function() {
			Registry.registerFolder(__dirname + '/modules', {
				instantiate: false
			});

			expect(get('needed')).to.be.an('function');
			expect(get('parent')).to.be.an('function');
			expect(get('testing')).to.be.an('function');
			expect(get('child-one')).to.be.an('function');
			expect(get('child-two')).to.be.an('function');
		});

		it('Should throw error', function() {
			assert.throw(function() {
				Registry.registerFolder(__dirname + '/moduless');
			}, Error);
		});

	});

	describe('#registerInitializer', function() {

		it('should register initializer', function() {
			var initializer = {
				name: 'init',
				initializer: function() {}
			};

			Registry.registerInitializer(initializer);

			assert.ok(Registry.__initializers.has('init'), 'Did not register an initializer');
			assert.deepEqual(Registry.__initializers.get('init'), initializer, 'initializers are not the same');
		});

		it('should throw no initializer function error', function() {
			assert.throw(function() {
				Registry.registerInitializer({});
			}, 'Initializer must contain an initializer method');

			assert.throw(function() {
				Registry.registerInitializer();
			}, 'Initializer must contain an initializer method');

			assert.throw(function() {
				Registry.registerInitializer('test');
			}, 'Initializer must contain an initializer method');
		});

	});

	describe('#runInitializers', function() {

		it('should invoke callback after all initializers are initialized', function(done) {

			var App = Registry.createApplication({
				listener: function(){}
			}), value;

			Registry.registerInitializer({
				name: 'second',
				initializer: function(container, app, callback) {
					assert.deepEqual(container, Registry.__container, 'container is not the same');
					assert.deepEqual(app, App, 'Application is not the same.');
					assert.typeOf(callback, 'function', 'callback is not a function');
					assert.deepEqual(value, 'loaded', 'initializer ran before the first initializer');

					callback();
				}
			});

			Registry.registerInitializer({
				name: 'first',
				before: 'second',
				initializer: function(container, app, callback) {
					value = 'loaded';

					callback();
				}
			});

			Registry.registerInitializer({
				name: 'thrid',
				before: 'nonExisting',
				initializer: function(container, app, callback) {
					callback();
				}
			});

			Registry.runInitializers(done);
		});

		it('should invoke callback with an error', function() {

			var App = Registry.createApplication({
				listener: function(){}
			});

			Registry.registerInitializer({
				name: 'initializer',
				initializer: function(container, app, callback) {
					callback(new Error('initializer error'));
				}
			});

			Registry.runInitializers(function(error) {
				assert.instanceOf(error, Error, 'Error is not returned');
				expect(error).to.have.property('message').and.contain('initializer error');
			});
		});

		it('should throw an error', function() {

			var App = Registry.createApplication({
				listener: function(){}
			});

			Registry.registerInitializer({
				name: 'initializer',
				initializer: function(container, app, callback) {
					throw new Error('initializer error');
				}
			});

			assert.throw(function() {
				Registry.runInitializers(function(error) {
				});
			}, 'initializer error');
		});

		it('should throw missing callback error', function() {
			assert.throw(function() {
				Registry.runInitializers();
			}, 'You must pass a callback function to this method.');
			assert.throw(function() {
				Registry.runInitializers({});
			}, 'You must pass a callback function to this method.');
			assert.throw(function() {
				Registry.runInitializers('test');
			}, 'You must pass a callback function to this method.');
			assert.throw(function() {
				Registry.runInitializers(1);
			}, 'You must pass a callback function to this method.');
		});

		it('should throw missing application error', function() {
			assert.throw(function() {
				Registry.runInitializers(function() {});
			}, "No application has been created. Please create on before runing initializers");
		});

	});

	describe('#createApplication', function() {

		it('should create an application', function() {
			var listener = function() {};

			var App = Registry.createApplication({
				port: 8080,
				listener: listener
			});

			expect(App).to.be.an('object');
			expect(App).to.have.property('port').and.equal(8080);
			expect(App).to.have.property('listener').and.equal(listener);

			assert.equal(App.getPort(), 8080, "Ports are not equal");
			assert.equal(App.getListener(), listener, "listener is not equal");

			assert.deepEqual(App, Registry.get('application'), 'application from the Registry is not equal');
		});

		it('should throw an error, when trying to crate an application with no config', function() {
			assert.throw(function() {
				Registry.createApplication();
			}, 'You must define options for the Application');
		});

		it('should throw an error, when trying to crate another application', function() {
			Registry.createApplication({});

			assert.throw(function() {
				Registry.createApplication({});
			}, 'Application is already created.');
		});

	});

	describe('#readEnv', function() {

		it('should read .env file', function() {

			Registry.readEnv(__dirname + "/mocks/env");

			var get = function(key) {
				return Registry.environment.get(key);
			};

			assert.deepEqual(get('PROPERTY'), 'value');
			assert.deepEqual(get('PROPERTY_NUMBER'), '1');
			assert.deepEqual(get('PROPERTY_BOOLEAN'), 'false');

		});

		it('should override property', function() {
			var get = function(key) {
				return Registry.environment.get(key);
			};

			Registry.environment.set('PROPERTY', 'different');

			assert.deepEqual(get('PROPERTY'), 'different');

			Registry.readEnv(__dirname + "/mocks/env", {
				overwrite: true
			});

			assert.deepEqual(get('PROPERTY'), 'value');
		});

		it('should not raise error', function() {
			assert.doesNotThrow(function() {
				Registry.readEnv(__dirname + "/mock");
			});
		});

		it('should raise not found file error', function() {
			assert.throw(function() {
				Registry.readEnv(__dirname + "/mock", {
					raise: true
				}, TypeError, 'Environment file doesn\'t exist');
			});
		});

	});

	describe('#reset', function() {
		
		it('Should clear container cache', function() {
			Registry.registerFolder(__dirname + '/modules');

			var needed = Registry.get('needed');
			var db = Registry.get('db');

			expect(needed).to.be.an('object');
			expect(db).to.be.an('object');

			assert.deepEqual(db, Registry.get('db'));
			assert.deepEqual(needed, Registry.get('needed'));

			Registry.reset();

			assert.notEqual(db, Registry.get('db'));
			assert.notEqual(needed, Registry.get('needed'));
		});

	});

	beforeEach(function() {
		Registry.reset();

		Registry.__container.registrations.data = {};
		Registry.__container.cache.data = {};
		Registry.__container.factoryCache.data = {};
		Registry.__container.resolveCache.data = {};
		Registry.__container._options.data = {};
	});

});