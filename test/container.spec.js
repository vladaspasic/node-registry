var Container = require('../lib/container/container'),
	Factory = require('../lib/object');

var chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect;

describe("Container", function() {

	it('Should return the same registration', function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);

		var module = container.lookup('module');

		assert.instanceOf(module, Module, "The lookup is not an instance of the factory");
		assert.equal(module, container.lookup('module'));
	});

	it("Should return the same lookupFactory", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);

		var moduleFactory = container.lookupFactory('module');

		assert.ok(moduleFactory, 'No factory is returned');
		assert.instanceOf(moduleFactory.create(), Module, "The lookup is not an instance of the factory");
	});

	it("Should return the same lookupFactory each time", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);

		assert.deepEqual(container.lookupFactory('module'), container.lookupFactory('module'),
			"Factories are not equal");
	});

	it("All instances build from factory, must have a container property", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);
		var module = container.lookup('module');

		assert.instanceOf(module, Module, "The lookup is not an instance of the factory");
		assert.ok(module.container, 'factory instance did not contain a container');
	});

	it("Should return a new instance if singleton: false is passed", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);

		var module1 = container.lookup('module');
		var module2 = container.lookup('module', { singleton: false });
		var module3 = container.lookup('module', { singleton: false });
		var module4 = container.lookup('module');

		assert.deepEqual(module1, module4, "module1 and module4 are not equal");
		assert.notEqual(module1, module2);
		assert.notEqual(module2, module3);
		assert.notEqual(module3, module4);

		assert.instanceOf(module1, Module, "The lookup is not an instance of the factory");
		assert.instanceOf(module2, Module, "The lookup is not an instance of the factory");
		assert.instanceOf(module3, Module, "The lookup is not an instance of the factory");
		assert.instanceOf(module4, Module, "The lookup is not an instance of the factory");
	});

	it("Should return a new instance for scope `instance`", function() {
		var container = new Container();
		var Module = Factory.extend({
			name: 'test module'
		});

		container.register('module', Module, { scope: 'instance' });

		var module1 = container.lookup('module');
		var module2 = container.lookup('module');

		assert.notEqual(module1, module2, "Modules are equal.");

		assert.instanceOf(module1, Module, "The lookup is not an instance of the factory");
		assert.instanceOf(module2, Module, "The lookup is not an instance of the factory");
	});

	it("Should return a same instance for scope `singleton`", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module.create(), { scope: 'singleton' });

		var module1 = container.lookup('module');
		var module2 = container.lookup('module');

		assert.deepEqual(module1, module2);

		assert.instanceOf(module1, Module, "The lookup is not an instance of the factory");
		assert.instanceOf(module2, Module, "The lookup is not an instance of the factory");
	});

	it("Should throw error for unknown `scope`", function() {
		var container = new Container();
		var Module = Factory.extend();

		assert.throw(function() {
			container.register('module', Module.create(), { scope: 'noidea' });
		}, TypeError, /^Unsuported scope value `noidea`/);

		assert.throw(function() {
			container.register('module', Module.create(), { scope: false });
		}, TypeError, /^Unsuported scope value /);

		assert.throw(function() {
			container.register('module', Module.create(), { scope: {} });
		}, TypeError, /^Unsuported scope value /);

		assert.throw(function() {
			container.register('module', Module.create(), { scope: 1234 });
		}, TypeError, /^Unsuported scope value /);

		assert.throw(function() {
			container.register('module', Module.create(), { scope: function() {} });
		}, TypeError, /^Unsuported scope value /);
	});

	it("Check if the module is registered", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);

		assert.equal(container.isRegistered('module'), true, "module should be registered");
		assert.equal(container.isRegistered('modules'), false, "modules should not be registered");
	});

	it("Should unregister the module and clear the cache", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);

		assert.equal(container.isRegistered('module'), true, "module should be registered");
		assert.instanceOf(container.lookup('module'), Module, "module is not an instance of Factory");

		container.unregister('module');

		assert.equal(container.isRegistered('module'), false, "module should not be registered");
		assert.throw(function() {
			container.lookup('module');
		}, "Factory with name 'module' can not be found.");

		container.register('module', Module);

		assert.equal(container.isRegistered('module'), true, "module should be registered");
		assert.instanceOf(container.lookup('module'), Module, "module is not an instance of Factory");

	});

	it("Check if the module is registered", function() {
		var container = new Container();
		var Module = Factory.extend(),
			Injection = Factory.extend();

		container.register('module', Module);
		container.register('injection', Injection);

		container.injection('module', 'injected', 'injection');

		var module = container.lookup('module');
		var injection = container.lookup('injection');

		assert.equal(module.injected, injection, "injected property should be equal to injection module");
	});

	it("Do not cache if singleton: false is passed", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module, { singleton: false });

		assert.notEqual(container.lookup('module'), container.lookup('module'),
			"Modules are not equal, they are cached");
	});

	it("Do not instantiate registration", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module, { instantiate: false });

		assert.typeOf(container.lookup('module'), 'function',
			"Module is not a function, therefore it is instantiated");
	});

	it("It should throw error for invalid or missing registration", function() {
		var container = new Container();

		container.register('module', function() {});
		container.register('module1', {});

		assert.throw(function() {
			container.lookup('module');
		}, "Factory is not the right type for Module: 'module'.");
		assert.throw(function() {
			container.lookup('module1');
		}, "Factory is not the right type for Module: 'module1'.");
		assert.throw(function() {
			container.lookup('missing');
		}, "Factory with name 'missing' can not be found.");
	});

	it('Should throw error for failed injection lookup', function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);
		container.injection('module', 'injected', 'injection');

		assert.throw(function() {
			container.lookup('module');
		}, "Factory with name 'injection' can not be found.");
	});

	it('Should destroy only cached singletons', function() {
		var container = new Container();
		var Module = Factory.extend();
		var Singleton = Factory.extend({
			single: true
		});

		container.register('module', Module, { singleton: false });
		container.register('singleton', Singleton);

		var module = container.lookup('module');
		var singleton = container.lookup('singleton');

		assert.instanceOf(singleton, Singleton, 'Wring instanceOf Singleton');
		assert.instanceOf(module, Module, 'Wring instanceOf Module');

		container.destroy();

		assert.ok(singleton.isDestroyed, 'Singleton should be destroyed');
		assert.notOk(module.isDestroyed, 'Module should not be destroyed');
	});

	it("Should be able to reregister a factory", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', {});
		container.register('module', Module);

		assert.instanceOf(container.lookup('module'), Module);
	});

	it("Should not be able to reregister a factory after its looked up", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);
		container.lookup('module');

		assert.throw(function() {
			container.register('module', {});
		}, 'Cannot re-register: \'module\', as it has already been registered.');
	});

	it("Should always return the same object when resolving, and change after a new registration", function() {
		var container = new Container();
		var Module = Factory.extend();

		container.register('module', Module);

		var resolved = container.resolve('module');

		assert.deepEqual(resolved, container.resolve('module'), 'Resolved modules are not equal.');

		container.register('module', null);

		assert.notEqual(resolved, container.resolve('module'), 'It should equal to null');
	});

});
