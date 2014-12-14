var chai = require('chai'),
	Registry = require('../lib');

var assert = chai.assert,
	expect = chai.expect,
	http = require('http');

var checkingFunction = function(req) {

};

var app = function(req, res) {
		res.writeHead(200, {
			'Content-Type': 'text/plain'
		});

		checkingFunction(req);

		res.end('Hello, world!\n');
	},
	Server;

describe('Request', function() {

	before(function() {
		Server = Registry.createServer(app);
	});

	beforeEach(function() {
		Server.start();
	});

	describe('#__setContainer', function() {

		it('Container should be already set, and can not be overriden', function(done) {

			checkingFunction = function(req) {
				assert.isDefined(req.__container, 'Container is not set.');

				assert.throw(function() {
					req.__setContainer('someContainer');
				}, 'Cannot redefine property: __container');

				done();
			};

			makeRequest();
		});

		it('Can not set an undefined value', function(done) {

			checkingFunction = function(req) {
				assert.throw(function() {
					req.__setContainer();
				}, 'Container is not defined.');

				done();
			};

			makeRequest();
		});

	});

	describe('#__destroyContainer', function() {

		it('Container should be destroyedt', function(done) {

			checkingFunction = function(req) {
				req.__destroyContainer();
				assert.ok(req.__container.isDestroyed);

				done();
			};

			makeRequest();
		});

		it('Container should be destroyed on end request', function(done) {

			checkingFunction = function(req) {
				req.on('end', function() {
					assert.ok(req.__container.isDestroyed);

					done();
				});
			};

			makeRequest();
		});

	});

	describe('#register', function() {

		it('Should register a module the Request container', function(done) {
			var service = {
				value: 'registered service'
			};

			checkingFunction = function(req) {
				assert.doesNotThrow(function() {
					req.register('service', service, {
						instantiate: false,
					});
				});

				assert.deepEqual(req.lookup('service'), service, 'registered service is not equal.');
				assert.deepEqual(req.lookup('service').value, service.value, 'registered service value is not equal.');

				assert.throw(function() {
					Registry.get('service');
				}, 'Factory with name \'service\' can not be found.');

				done();
			};

			makeRequest();
		});

	});

	describe('#injection', function() {

		it('Should perform injection', function(done) {
			var service = Registry.Module.extend({
					value: 'registered service'
				}),
				injection = {
					value: 'injected value'
				};

			checkingFunction = function(req) {
				assert.doesNotThrow(function() {
					req.register('service', service);

					req.register('injection', injection, {
						instantiate: false,
					});

					req.injection('service', 'injected', 'injection');
				});

				assert.deepEqual(req.lookup('service').injected, injection, 'Injected module is not equal.');
				assert.deepEqual(req.lookup('service').injected.value, injection.value, 'Injected module is not equal.');

				assert.throw(function() {
					Registry.get('service');
				}, 'Factory with name \'service\' can not be found.');

				assert.throw(function() {
					Registry.get('injection');
				}, 'Factory with name \'injection\' can not be found.');

				done();
			};

			makeRequest();
		});

	});

	describe('#lookup', function() {

		it('Should perform lookup', function(done) {
			var service = {
				value: 'registered service'
			};

			checkingFunction = function(req) {
				req.register('service', service, {
					instantiate: false,
				});

				assert.doesNotThrow(function() {
					req.lookup('service');
				});

				assert.deepEqual(req.lookup('service'), service, 'registered service is not equal.');
				assert.deepEqual(req.lookup('service').value, service.value, 'registered service value is not equal.');

				assert.throw(function() {
					Registry.get('service');
				}, 'Factory with name \'service\' can not be found.');

				done();
			};

			makeRequest();
		});

	});

	afterEach(function() {
		Server.stopServer();
	});

	after(function() {
		Registry.reset();

		Registry.isRunning = false;
		Registry.__container.registrations.data = {};
		Registry.__container.cache.data = {};
		Registry.__container.factoryCache.data = {};
		Registry.__container.resolveCache.data = {};
		Registry.__container._options.data = {};
		Registry.__container.children = [];
	});

});

function makeRequest() {
	http.get('http://localhost:8000');
}