// global functions
var modPath = require('path')
global.buildAppPath = function(pathRelativeToAppRoot) {
    return modPath.join(modPath.dirname(__filename), pathRelativeToAppRoot);
}

// load modules
var app_core = require('./app/core/core.js'), // parse command line options; initialize app
    app_express = require('./app/express/express.js'), // setup and start express server
    app_socketio = require('./app/socketio/socketio.js'); // setup and start socket.io


console.log('Server running on '+app_core.config.host+':'+app_core.config.port);
