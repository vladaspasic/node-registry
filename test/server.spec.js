var chai = require('chai'),
	Registry = require('../lib');
Server = require('../lib/server');
http = require('http');

var assert = chai.assert,
	expect = chai.expect;

var app = function(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/plain'
	});
	res.end('Hello, world!\n');
};

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

			Registry.environment.set('port', 8080);
			assert.equal(Server.getPort(), 8080, 'Environment port not equal');

			Server.port = undefined;
			assert.equal(Server.getPort(), 8080, 'Did not used the environment port');

			Registry.environment.remove('port');
			assert.equal(Server.getPort(), 8000, 'Did not used the default port');

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

		it('Should throw SSL not found error', function() {
			Server.ssl = {
				key: 'not-found',
				cert: 'not-found'
			};

			assert.throw(function() {
				Server.createServer();
			}, "ENOENT, no such file or directory 'not-found'");
		});

		it('Should load HTTPS server', function() {
			Server.ssl = {
				key: __dirname + '/mocks/keys.txt',
				cert: __dirname + '/mocks/keys.txt'
			};

			assert.doesNotThrow(function() {
				Server.createServer();
			}, "Error occured while creating HTTPS server");

			Server.ssl = undefined;
		});

	});

	describe('#startServer', function() {

		it('Should start HTTP server', function(done) {
			Server = Registry.createServer({
				listener: app
			});

			Server.start(function(error, server) {
				if(error) return done(error);
				
				makeRequest(false, done);
			});
		});

	});

	beforeEach(function() {
		Registry.reset();
	});

	after(function() {
		Registry.reset();

		Registry.isRunning = false;
		Registry.__container.registrations.data = {};
		Registry.__container.cache.data = {};
		Registry.__container.factoryCache.data = {};
		Registry.__container.resolveCache.data = {};
		Registry.__container._options.data = {};
	});

});

function makeRequest(isSecure, callback) {
	http.get('http://localhost:' + (isSecure ? 443 : 8000), function(res) {
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