var Registry = require('./registry').getInstance();

Registry.Object = require('./object');
Registry.EventEmitter = require('./event-emitter');
Registry.Module = require('./module');
Registry.OrderedConfiguration = require('./ordered-configuration');

/**
 * Node Registry Module
 * 
 * @module Registry
 */
module.exports = Registry;
