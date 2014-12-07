var Registry = require('../lib/registry').getInstance();
	http = require('http');

module.exports = {
	/**
	 * Description
	 * @method createServer
	 * @param {} port
	 * @param {} done
	 * @return 
	 */
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
		} catch(error) {
			console.warn("Error while starting server", error);
			done(error);
		}
	},
	/**
	 * Description
	 * @method clearRegistry
	 * @return 
	 */
	clearRegistry: function() {
		Registry.clear();
	},
	/**
	 * Description
	 * @method makeRequest
	 * @param {} port
	 * @param {} done
	 * @return 
	 */
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