var modExpress = require('express'),
    modHttp = require('http'),
    modPath = require('path'),
    app_core = require(global.buildAppPath('app/core/core.js')),
    route_index = require('./routes/index.js'),
    route_client = require('./routes/client.js'),
    route_master = require('./routes/master.js');

var app = modExpress(),
    server = modHttp.createServer(app);

// configure express
app.configure(function(){
    app.set('core', {config: app_core.config}),
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(modExpress.cookieParser());
    app.use(modExpress.session(app_core.config.express.session));
    app.use(modExpress.favicon());
    app.use(modExpress.bodyParser());
    app.use(modExpress.methodOverride());
    app.use(app.router);
    app.use(modExpress.static(modPath.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(modExpress.logger('dev'));
    app.use(modExpress.errorHandler());
});

// routes
// index
app.get('/', function(req, res) {
    route_index.index(req, res, false);
});
app.get('/index', function(req, res) {
    route_index.index(req, res, false);
});
app.get('/json/index', function(req, res) {
    route_index.json.index(req, res, false);
});

// client: redirect to current url
app.get('/client/:clientPort', route_client.client);

// master
// createMaster
app.post('/json/createMaster', route_master.json.createMaster);

// status page
app.get('/master/:token/:clientPort', route_master.master);

// start express server
server.listen(app_core.config.port, app_core.config.host);


// export server
exports.server = server;
// export app
exports.app = app;