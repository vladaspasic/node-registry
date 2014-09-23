var chai = require('chai'),
	http = require('http'),
	server = require('../lib/server');

var assert = chai.assert,
	expect = chai.expect;

var app = function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Hello, world!\n');
};

var Instance = false;

describe('Server specs', function() {

	describe('#create', function() {

		before(function(done) {
			server.create({}, app, function(err, ser) {
				Instance = ser;

				done(err, ser);
			});
		});

		it('should start a server with default settings', function(done) {
			http.get('http://localhost:8000', function(res) {
				var data = '';

				res.on('data', function (chunk) {
					data += chunk;
				});

				res.on('end', function () {
					assert.equal('Hello, world!\n', data);
					done();
				});
			});
		});

		after(function() {
			Instance && Instance.close();
			Instance = false;
		});

	});

});