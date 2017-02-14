const express = require('express');
const app = express();

app.get('/', (req, res) => res.end('Hello world'))

module.exports = {

  server(project, container, environment) {
    return {
      port: environment.get('server.port', 8080),
      listener: app
    };
  }

}
