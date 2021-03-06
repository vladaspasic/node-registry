/*jslint node: true */
"use strict";

const EventEmitter = require('./event-emitter'),
	_ = require('lodash');

/** 
 * Building block for the Registry IoC.
 * 
 * @class Module
 * @extends {EventEmitter}
 */
const AbstractModule = EventEmitter.extend({

	/**
	 * Returns the requirements for this module.
	 * These requirements are injected into the module when
	 * it is being constructed by the registry.
	 * 
	 * @method getRequirements
	 * @return {Array}
	 */
	getRequirements() {
		if (!this.requires) {
			return [];
		} else if (_.isString(this.requires)) {
			return [this.requires];
		} else if (_.isArray(this.requires)) {
			return this.requires;
		}

		throw new TypeError('Module \'requires\' property must be a String an Array');
	},

	/**
	 * Returns the Module name
	 * 
	 * @method getName
	 * @return {String}
	 */
	getName() {
		if (!_.isString(this.name)) {
			throw new TypeError("Module name must be a String, you passed: " + typeof this.name);
		}

		return this.name;
	},

	toString() {
		return 'Registry.Module';
	}
}, {
	type: 'Module'
});

AbstractModule.isModuleConstructor = true;

module.exports = AbstractModule;