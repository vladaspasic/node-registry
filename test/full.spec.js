var chai = require('chai'),
	Registry = require('../lib')({
		location: __dirname + '/modules'
	});

var assert = chai.assert,
	expect = chai.expect;

describe('Registry spec', function() {

	describe("#get", function(){

		before(function(done) {
			Registry.start(done);
		});

		it('should get the right module', function() {
			expect(Registry.get('testing')).to.have.property('value');
		});

		it('should get the right module value', function() {
			expect(Registry.get('testing.value')).to.equal('Some testeable data');
		});

		it('should get the a right function return value', function() {
			expect(Registry.get('testing.fun.anotherFun')).to.equal('function value');
		});

		it('should get the a function', function() {
			assert(typeof Registry.get('testing.notFun') === 'function');
		});

		it('should not get the a function', function() {
			assert(typeof Registry.get('testing.notFun.nope') !== 'function');
		});

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

});