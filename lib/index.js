var Registry = require('./registry').getInstance();

Registry.Object = require('./object');
Registry.EventEmitter = require('./event-emitter');
Registry.Module = require('./module');
Registry.OrderedConfiguration = require('./ordered-configuration');

module.exports = Registry;