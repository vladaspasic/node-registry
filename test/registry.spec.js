var chai = require('chai'),
	http = require('http'),
	utils = require('./utils'),
	Registry = require('../lib/registry').getInstance();

var options = {
	location: __dirname + '/modules'
};

var assert = chai.assert,
	expect = chai.expect,
	port = 1234;

describe('Registry spec', function() {
	this.timeout(10000);

	before(function(done) {
		Registry.scanDirectories('/test/modules');

		utils.createServer(port, done);
	});

	describe("#get", function() {

		it('should get the right module', function() {
			expect(Registry.get('errors')).to.have.property('errors');
		});

		it('should get the right module value', function() {
			expect(Registry.get('needed.configuration.defaults')).to.equal('defaults');
		});

		// it('should get the a right function return value', function() {
		// 	expect(Registry.get('testing.fun.anotherFun')).to.equal('function value');
		// });

		// it('should get the a function', function() {
		// 	assert(typeof Registry.get('testing.notFun') === 'function');
		// });

		// it('should access children modules', function() {
		// 	expect(Registry.get('parent:child-one')).to.have.property('value');
		// 	expect(Registry.get('parent:child-two')).to.have.property('value');
		// });

		it('should get null value', function() {
			expect(Registry.get('no.defined.property')).to.equal(null);
		});

		it('should get not supported argument error', function() {
			try {
				Registry.get();
			} catch(e) {
				assert.equal(e.message, "You must pass a string argument to this function");
			}
		});

	});

	describe("#exists()", function() {

		it('module should exists', function() {
			expect(Registry.exists('testing')).to.equal(true);
		});

		it('module should not exists', function() {
			expect(Registry.exists('unknown')).to.equal(false);
		});
	});

	describe('#start', function() {	

		it('Should start server', function(done) {

			var s = 0;
			var request = function() {
				return utils.makeRequest(port, function(error, data) {
					++s;

					if(error) return done(error);
					
					assert.equal('Hello, world!\n', data);

					if(s === 4) done();
				});
			};

			for (var i = 3; i >= 0; i--) {
				setTimeout(request, 500 * i);
			}
		});

		it('should load modules', function() {
			expect(Registry._modules).to.have.property('needed');
			expect(Registry._modules).to.have.property('db');
			expect(Registry._modules).to.have.property('testing');
		});

		it('should clear registrations', function() {
			expect(Registry._registrations).to.be.empty;
		});

	});

	describe('#reopen', function() {

		// it('should reopen a module', function(done) {

		// 	Registry.reopen('testing', function(err, data) {
		// 		expect(data).to.have.property('value');
		// 		expect(data).to.have.property('fun');
		// 		expect(data).to.have.property('notFun');

		// 		done(err, data);
		// 	});

		// });

		// it('should throw an error', function(done) {

		// 	Registry.reopen('unknown', function(e, data) {
		// 		assert.equal(e.message, 'No module with name: unknown found');

		// 		done(null, e);
		// 	});

		// });

	});

	after(function() {
		Registry.clear();
	});

});