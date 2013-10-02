// global functions
var modPath = require('path')
global.buildAppPath = function(pathRelativeToAppRoot) {
    return modPath.join(modPath.dirname(__filename), pathRelativeToAppRoot);
}

// load modules
var app_core = require('./app/core/core.js'), // parse command line options; initialize app
    app_express = require('./app/express/express.js'), // setup and start express server
    app_socketio = require('./app/socketio/socketio.js'), // setup and start socket.io
    modChildProcess = require('child_process'),
    weinre;


console.log('Server running on '+app_core.config.host+':'+app_core.config.port);
if (app_core.config.weinre.host && app_core.config.weinre.port) {
    console.log('Trying to start weinre on '+app_core.config.weinre.host+':'+app_core.config.weinre.port);
    weinre = modChildProcess.spawn('weinre', ['--boundHost', app_core.config.weinre.host, '--httpPort', app_core.config.weinre.port]);

    weinre.stdout.on('data', function(data) {
       console.log('[weinre]: '+data);
    });
    weinre.stderr.on('data', function(data) {
        console.log('[weinre]: '+data);
    });
    weinre.on('close', function(code) {
        console.log('[weinre]: exit with code '+code);
    });
}
