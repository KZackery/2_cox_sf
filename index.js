'use strict'

require('dotenv').load();

var async = require('async')
  , express = require('express')
  , bodyParser = require('body-parser')
  , http = require('http')
  , socketIO = require('socket.io')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , recordsApp = require('./lib/records')
  , settingsApp = require('./lib/settings')
  , statusApp = require('./lib/status');

var port = process.env.PORT,
    app = express(),
    server = http.Server(app),
    io = socketIO.listen(server);

// for parsing application/json
app.use(bodyParser.json());

var statusRoute = express.Router();
statusApp(statusRoute);
app.use('/_status_', statusRoute);

app.get('/showroomstatus', function (req, res) {
  res.redirect('/_status_/update');
});

var statsRoute = express.Router();
recordsApp(statsRoute);
settingsApp(statsRoute);
app.use('/stats', statsRoute);

// Listen for TV-Tablet Transfer
io.on('connection', function(socket) {
  console.log('Socket connection established');

  socket.on('request', function(msg) {
    io.emit('request', msg);
  });

  socket.on('response', function(msg) {
    io.emit('response', msg);
  });
});

if(fs.existsSync(__dirname + '/public')) {
  app.use(express.static(__dirname + '/public'));
}

// Ensure port is set
function ensurePort(callback) {
  if (!port) {
    callback(new Error("Port not set"));
  }
  callback();
}

async.waterfall([
  ensurePort,
], function(err) {
  if (err) {
    console.error(err);
    process.exit(1)
  }
  server.listen(port, function() {
    console.log('Server listening now on : ' + port);
  });
});
