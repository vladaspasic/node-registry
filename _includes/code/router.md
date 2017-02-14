const Registry = require('node-registry')

module.exports = function() {
  const greeter = Registry.get('greeter')
  
  this.get('/', (req, res) => res.end(greeter.hello())

  this.get('/:name', (req, res) => res.end(greeter.greet(req.params.name))

}
