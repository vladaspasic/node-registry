var Registry = require('../lib/registry').getInstance();
http = require('http');

module.exports = {

	createServer: function(port, done) {
		try {
			Registry.start({
				port: (port || 8000)
			}, function(req, res) {
				res.writeHead(200, {
					'Content-Type': 'text/plain'
				});
				res.end('Hello, world!\n');
			}, function() {
				done();
			});
		} catch (error) {
			console.warn("Error while starting server", error);
			done(error);
		}
	},
	
	clearRegistry: function() {
		Registry.reset();

		Registry.isRunning = false;
		Registry.__container.registrations.data = {};
		Registry.__container.cache.data = {};
		Registry.__container.factoryCache.data = {};
		Registry.__container.resolveCache.data = {};
		Registry.__container._options.data = {};
		Registry.__container.children = [];
	},

	makeRequest: function(port, done) {
		http.get('http://localhost:' + (port || 8000), function(res) {
			var data = '';

			res.on('data', function(chunk) {
				data += chunk;
			});

			res.on('error', done);

			res.on('end', function() {
				return done(null, data);
			});
		});
	}
};