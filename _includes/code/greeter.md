const util = require('util')

module.exports = {

  hallo() {
    return 'World, meet Registry!'
  },

  greet(name) {
    cosnt message = this.environment.get('greeter.message')
    return util.format(message, name)
  }

}
