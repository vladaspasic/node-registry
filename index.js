module.exports = require('./lib');

var http = require('http'),
	fs = require('fs'),
	data = require('./docs/data.json');


var project = data.project;

var server = http.createServer(function(req, res) {
	res.write(JSON.stringify(project));
		res.end();
});

server.listen(8000);