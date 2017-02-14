/* global describe, afterEach, it */
var chai = require('chai'),
	Environment = require('../lib/environment'),
	loader = require('../lib/environment/loader');

var assert = chai.assert,
	expect = chai.expect;

var env;

describe('Environment specs', function() {

	describe('#get', function() {
		
		it('Should load project test config files', function() {
			env = new Environment();

			Environment.loadProjectConfiguration();

			assert.equal(env.get('js'), 'loaded');
			assert.equal(env.get('json'), 'loaded');
			assert.equal(env.get('yml'), 'loaded');
			assert.equal(env.get('yaml'), 'loaded');
			assert.equal(env.get('mode'), 'test');
			expect(env.get('Sex')).to.include.members(['male', 'female']);
			expect(env.get('Animals')).to.have.all.keys(['aardvark', 'anteater', 'anaconda']);

			assert.equal(env.get('Animals.anaconda'), 'South-American constrictor snake. Scaly.');
			assert.equal(env.get('Animals.aardvark'), 'African pig-like ant eater. Ugly.');
			assert.equal(env.get('Animals.anteater'), 'South-American ant eater. Two species.');

			assert.equal(env.get('unknown', 'Default value'), 'Default value');

		});

		it('Should load test development files', function() {
			env = new Environment();
			Environment.loadProjectConfiguration(undefined, 'development');

			assert.equal(env.get('js'), 'loaded');
			assert.equal(env.get('json'), 'loaded');
			assert.equal(env.get('yml'), 'loaded');
			assert.equal(env.get('yaml'), 'loaded');
			assert.equal(env.get('mode'), 'development');
			expect(env.get('Sex')).to.include.members(['male', 'female']);
			expect(env.get('Animals')).to.have.all.keys(['aardvark', 'anteater', 'anaconda']);

			assert.equal(env.get('Animals.anaconda'), 'South-American constrictor snake. Scaly.');
			assert.equal(env.get('Animals.aardvark'), 'African pig-like ant eater. Ugly.');
			assert.equal(env.get('Animals.anteater'), 'South-American ant eater. Two species.');

			assert.equal(env.get('unknown', 'Default value'), 'Default value');

		});

		it('Should load test production files', function() {
			env = new Environment();
			Environment.loadProjectConfiguration(undefined, 'production');

			assert.equal(env.get('js'), 'loaded');
			assert.equal(env.get('json'), 'loaded');
			assert.equal(env.get('yml'), 'loaded');
			assert.equal(env.get('yaml'), 'loaded');
			assert.equal(env.get('mode'), 'production');
			assert.isNumber(env.get('Number'));
			assert.isString(env.get('String'));
			assert.isBoolean(env.get('Boolean'));
			expect(env.get('Sex')).to.include.members(['male', 'female']);
			expect(env.get('Animals')).to.have.all.keys(['aardvark', 'anteater', 'anaconda']);

			assert.equal(env.get('Animals.anaconda'), 'South-American constrictor snake. Scaly.');
			assert.equal(env.get('Animals.aardvark'), 'African pig-like ant eater. Ugly.');
			assert.equal(env.get('Animals.anteater'), 'South-American ant eater. Two species.');

			assert.equal(env.get('unknown', 'Default value'), 'Default value');

		});


	});

	describe('#getRequired', function() {
		env = new Environment();

		expect(function() {
			env.getRequired('unknown');
		}).to.throw(Error, /Could not find Environment property: unknown/);
	});

	describe('#clear', function() {
		
		it('Should clear all configuration properties', function() {
			env = new Environment();
			Environment.loadProjectConfiguration();

			assert.equal(env.get('mode'), 'test');

			env.clear();

			expect(function() {
				env.getRequired('mode');
			}).to.throw(Error, /Could not find Environment property: mode/);
		});

		it('Should not clear process environment properties', function() {
			env = new Environment();
			Environment.loadProjectConfiguration();

			assert.equal(env.get('NODE_ENV'), 'test');

			env.clear();

			assert.equal(env.get('NODE_ENV'), 'test');
		});

	});

	describe('#loadConfiguration', function() {

		it('Should load from default location', function() {
			env = new Environment();
			Environment.loadProjectConfiguration();

			assert.equal(env.get('NODE_ENV'), 'test');
			assert.equal(env.get('mode'), 'test');
		});

		it('Should load from `config` location', function() {
			env = new Environment();
			Environment.loadConfiguration('test/config');

			assert.equal(env.get('json'), 'loaded');
		});

		it('Should load from `config` location with `staging` mode', function() {
			env = new Environment();
			Environment.loadConfiguration('test/config', 'staging');

			assert.equal(env.get('json'), 'loaded');
			assert.equal(env.get('mode'), 'staging');
		});

	});

	describe('#loader', function() {

		it('Should read .env and process.env', function() {
			var map = new Map();

			loader.readEnv('test/mocks', map);

			assert.equal(map.get('NODE_ENV'), 'test');
			assert.equal(map.get('NODE_REGISTRY_CONFIG'), 'test/configuration');
			assert.equal(map.get('PROPERTY'), 'value');
			assert.equal(map.get('PROPERTY_NUMBER'), 1);
			assert.equal(map.get('PROPERTY_BOOLEAN'), 'false');
		});

		it('Should read staging config files', function() {
			var env = {};

			loader.readConfiguration('test/config', 'staging', env);

			assert.equal(env['json'], 'loaded');
			assert.equal(env['mode'], 'staging');
		});

		it('Should not read config files as folder does not exists', function() {
			var map = new Map();

			loader.readConfiguration('test/config/folder/undefined', map);

			assert.equal(map.size, 0, 'Map should be empty');
		});

	});

	afterEach(function() {
		if(env) {
			env.clear();
			env = null;
		}
	});

});

