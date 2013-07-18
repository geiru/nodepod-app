var app_core = require(global.buildAppPath('app/core/core.js')),
    masterList = app_core.masterList,
    route_index = require('./index.js');

//
// checks if master exists and redirects to reverse proxy
//
function client(req, res)
{
    var clientPort = req.params.clientPort,
        master,
        error = false;

    master = masterList.getMaster(clientPort);

    if (!master) {
        error = 'Unknown master.';
    }

    if (error) {
        // render error
        route_index.index(req, res, error);
    }
    else {
        // redirect to reverse proxy
        res.writeHead(303, {
            'Location': app_core.config.protocol+'://'+app_core.config.host+':'+clientPort+master.clientProxy.getPath()
        });
        res.end();
    }
}


exports.client = client;