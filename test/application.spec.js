var chai = require('chai'),
	Registry = require('../lib');
Application = require('../lib/application');
http = require('http');

var assert = chai.assert,
	expect = chai.expect;

var app = function(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/plain'
	});
	res.end('Hello, world!\n');
};

var Application = Registry.createApplication({
	listener: app
});

var Instance = false;

describe('Application', function() {

	it('shoud not share the same container', function() {
		assert.notEqual(Application.container, Registry.__container);
	});

	it('shoud have the registry Instance', function() {
		assert.deepEqual(Application.registry, Registry);
	});

	describe('#get', function() {

		it('Should return right module', function() {
			Registry.registerFolder(__dirname + '/modules');
			var db = Application.get('db');

			expect(db).to.be.an('object');

			assert.deepEqual(db, Application.get('db'));
		});

	});

	describe('#getListener', function() {
		it('Should return a listener', function() {
			assert.deepEqual(Application.getListener(), app, "listener is not equal");
		});

		it('Should throw error for missing/wrong type listener', function() {
			Application.listener = 'listener';

			assert.throw(function() {
				Application.getListener();
			}, 'Listener must be a fuction.');

			Application.listener = {};

			assert.throw(function() {
				Application.getListener();
			}, 'Listener must be a fuction.');

			Application.listener = 1;

			assert.throw(function() {
				Application.getListener();
			}, 'Listener must be a fuction.');

			Application.listener = null;

			assert.throw(function() {
				Application.getListener();
			}, 'Listener must be a fuction.');

			Application.listener = undefined;

			assert.throw(function() {
				Application.getListener();
			}, 'No listener has been defined for the Application.');
		});

	});

	describe('#setListener', function() {
		it('Should set a listener', function() {
			assert.doesNotThrow(function() {
				Application.setListener(app);
			});
		});

		it('Should throw error for missing/wrong type listener', function() {
			assert.throw(function() {
				Application.setListener('listener');
			}, 'Listener must be a fuction.');

			assert.throw(function() {
				Application.setListener(1);
			}, 'Listener must be a fuction.');

			assert.throw(function() {
				Application.setListener({});
			}, 'Listener must be a fuction.');

			assert.throw(function() {
				Application.setListener();
			}, 'No listener has been defined for the Application.');
		});

	});

	describe('#getPort', function() {

		it('shoud return the right port', function() {
			assert.equal(Application.getPort(), 8000, 'Default port not equal');

			Registry.environment.set('port', 8080);
			assert.equal(Application.getPort(), 8080, 'Environment port not equal');

			Application.port = 1234;
			assert.equal(Application.getPort(), 1234, 'Default port not equal');

			Application.port = undefined;
			assert.equal(Application.getPort(), 8080, 'Did not used the environment port');

			Registry.environment.remove('port');
			assert.equal(Application.getPort(), 8000, 'Did not used the default port');

			Application.ssl = {};
			assert.equal(Application.getPort(), 443, 'SSL port not is not used');

			Application.ssl = undefined;
		});

	});

	describe('#createServer', function() {

		it('Should create a server', function() {
			var server = Application.createServer();

			assert.ok(server, "Server is not created");
			expect(server).to.be.an('object');
			expect(server).to.have.property('listen');
		});

		it('Should throw SSL not found error', function() {
			Application.ssl = {
				key: 'not-found',
				cert: 'not-found'
			};

			assert.throw(function() {
				Application.createServer();
			}, "ENOENT, no such file or directory 'not-found'");
		});

		it('Should load HTTPS server', function() {
			Application.ssl = {
				key: __dirname + '/mocks/keys.txt',
				cert: __dirname + '/mocks/keys.txt'
			};

			assert.doesNotThrow(function() {
				Application.createServer();
			}, "Error occured while creating HTTPS server");

			Application.ssl = undefined;
		});

	});

	describe('#startServer', function() {

		it('Should start HTTP server', function(done) {
			Application.startServer(function(error, server) {
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