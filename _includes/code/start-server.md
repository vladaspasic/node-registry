const Registry = require('node-registry')

// Register your modules folder
Registry.registerFolder(__dirname + '/modules');

// Start the server
Registry.startServer((error) => {
  if (error) {
    Registry.logger.error('Cound not start Server', error)
  } else {
    Registry.logger.info('Server started')
  }
})
