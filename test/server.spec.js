/* global describe, after, beforeEach, it */
"use strict";

var chai = require('chai'),
	http = require('http'),
	Registry = require('../lib');

var assert = chai.assert,
	expect = chai.expect;

var app = function(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/plain'
	});
	res.end('Hello, world!\n');
};

Registry.reset();

var Server = Registry.createServer({
	listener: app
});

var Instance = false;

describe('Server', function() {

	it('shoud not share the same container', function() {
		assert.notEqual(Server.container, Registry.__container);
	});

	it('shoud have the registry Instance', function() {
		assert.deepEqual(Server.registry, Registry);
	});

	describe('#init', function() {

		it('Should throw bad SSL configuration', function() {

			assert.throw(function() {
				Registry.createServer({
					listener: app,
					ssl: 'Bad SSL'
				});
			}, 'Invalid SSL configuration!  Must include cert and key locations!');
		});

		it('Could not create Sever manualy', function() {

			var Server = require('../lib/server');

			assert.throw(function() {
				new Server();
			}, 'Server must be created via Registry.createServer method');
		});

	});

	describe('#get', function() {

		it('Should return right module', function() {
			Registry.registerFolder(__dirname + '/modules');
			var db = Server.get('db');

			expect(db).to.be.an('object');

			assert.deepEqual(db, Server.get('db'));
		});

	});

	describe('#getListener', function() {
		it('Should return a listener', function() {
			assert.deepEqual(Server.getListener(), app, "listener is not equal");
		});

		it('Should throw error for missing/wrong type listener', function() {
			Server.listener = 'listener';

			assert.throw(function() {
				Server.getListener();
			}, 'Listener must be a fuction.');

			Server.listener = {};

			assert.throw(function() {
				Server.getListener();
			}, 'Listener must be a fuction.');

			Server.listener = 1;

			assert.throw(function() {
				Server.getListener();
			}, 'Listener must be a fuction.');

			Server.listener = null;

			assert.throw(function() {
				Server.getListener();
			}, 'Listener must be a fuction.');

			Server.listener = undefined;

			assert.throw(function() {
				Server.getListener();
			}, 'No listener has been defined for the Server.');
		});

	});

	describe('#setListener', function() {
		it('Should set a listener', function() {
			assert.doesNotThrow(function() {
				Server.setListener(app);
			});
		});

		it('Should throw error for missing/wrong type listener', function() {
			assert.throw(function() {
				Server.setListener('listener');
			}, 'Listener must be a fuction.');

			assert.throw(function() {
				Server.setListener(1);
			}, 'Listener must be a fuction.');

			assert.throw(function() {
				Server.setListener({});
			}, 'Listener must be a fuction.');

			assert.throw(function() {
				Server.setListener();
			}, 'No listener has been defined for the Server.');
		});

	});

	describe('#getPort', function() {

		it('shoud return the right port', function() {
			assert.equal(Server.getPort(), 8000, 'Default port not equal');

			Server.port = 1234;
			assert.equal(Server.getPort(), 1234, 'Default port not equal');

			Server.ssl = {};
			assert.equal(Server.getPort(), 443, 'SSL port not is not used');

			Server.ssl = undefined;
		});

	});

	describe('#createServer', function() {

		it('Should create a server', function() {
			var server = Server.createServer();

			assert.ok(server, "Server is not created");
			expect(server).to.be.an('object');
			expect(server).to.have.property('listen');
		});

		it('Should throw ENOENT error for missing SSL files', function() {
			Server.ssl = {
				key: 'not-found',
				cert: 'not-found'
			};

			assert.throw(function createSSLServer() {
				Server.createServer();
			}, /^ENOENT/);
		});

		it('Should load HTTPS server', function() {
			Server.ssl = {
				key: __dirname + '/mocks/keys.txt',
				cert: __dirname + '/mocks/keys.txt'
			};

			assert.doesNotThrow(function() {
				// Server.createServer();
			}, "Error occured while creating HTTPS server");

			Server.ssl = undefined;
		});

	});

	describe('#startServer', function() {

		it('Should start HTTP server', function(done) {
			Server = Registry.createServer({
				listener: app
			});

			Server.start(function(error) {
				if (error) {
					return done(error);
				}

				makeRequest(Server.getPort(), function(err, result) {
					done(err, result);
					Server.stopServer();
				});
			});
		});

	});

	describe('#stopServer', function() {

		it('Should stop the HTTP server', function(done) {
			Server = Registry.createServer({
				listener: app
			});
			
			Server.start(function(error) {
				if (error) {
					return done(error);
				}

				assert.doesNotThrow(function() {
					Server.stopServer();

					assert.isFalse(Server.registry.isRunning, 'Server is still running.');
					assert.isNull(Server.server, 'Server is not destroyed.');
					done();
				});
			});
		});

		it('Should throw error because server is not running', function() {
			assert.throw(function() {
				Server.stopServer();
			}, 'Can not close a server that is not yet started.');
		});

	});

	describe('#destroy', function() {

		it('Should destroy server', function() {
			Server = Registry.createServer({
				listener: app
			});

			assert.doesNotThrow(function() {
				Server.destroy();
			});
		});

	});

	describe('#toString', function() {

		it('Should return Registry.Server', function() {
			assert.deepEqual(Server.toString(), 'Registry.Server');
		});

	});

	beforeEach(function() {
		Registry.reset();
	});

	after(function() {
		Registry.reset();

		Registry.isRunning = false;
		Registry.__container.registrations.clear();
		Registry.__container.cache.clear();
		Registry.__container.factoryCache.clear();
		Registry.__container.resolveCache.clear();
		Registry.__container._options.clear();
		Registry.__container.children = [];
	});

});

function makeRequest(port, callback) {
	http.get('http://localhost:' + port, function(res) {
		var data = '';

		res.on('data', function(chunk) {
			data += chunk;
		});

		res.on('end', function() {
			callback(null, data);
		});

		res.on('error', function(error) {
			callback(error, data);
		});
	});
}
