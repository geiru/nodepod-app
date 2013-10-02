var app_core = require(global.buildAppPath('app/core/core.js')),
    masterList = app_core.masterList,
    Master = require(global.buildAppPath('app/core/master.js')).Master,
    ClientProxy = require(global.buildAppPath('app/core/client_proxy.js')).ClientProxy,
    modStep = require('step'),
    route_index = require('./index.js');

function createMaster(req, res)
{
    var clientPort = masterList.getNextClientPort(),
        stepClosure = {},
        responseMaster,
        password,
        error = false;

    if (req.body.master.password) {
        password = req.body.master.password;
    }
    else {
        password = false;
    }

    if (app_core.config.require_master_passwords && !password) {
        error = 'You must provide a password.';
    }
    else {
        try {
            // create new master
            master = new Master(clientPort, (req.body.master.name ? req.body.master.name : null), password);

            // render client and pass to ClientProxy
            modStep(
                function() {
                    res.render('empty_client.ejs', {master: master}, this);
                },
                function(err, emptyClientHtml) {
                    if (err) throw err;

                    stepClosure.emptyClientHtml = emptyClientHtml;
                    res.render('elements/client_head.ejs', {master: master}, this);
                },
                function(err, clientHeadHtml) {
                    if (err) throw err;

                    // create client proxy on client port and app host
                    master.clientProxy = new ClientProxy(
                        master.clientPort,
                        app_core.config.host,
                        stepClosure.emptyClientHtml,
                        clientHeadHtml
                    );
                    // exclude self
                    master.clientProxy.urlObjExcluded.push({
                        hostname: app_core.config.host.toString(),
                        port: app_core.config.port.toString()
                    });
                    // exclude weinre
                    if (app_core.config.weinre.host && app_core.config.weinre.port) {
                        master.clientProxy.urlObjExcluded.push({
                            hostname: app_core.config.weinre.host.toString(),
                            port: app_core.config.weinre.port.toString()
                        })
                    }

                    // start client proxy
                    master.clientProxy.start();
                    // hold reference to master
                    masterList.addMaster(master);
                    // render master view and send response
                    responseMaster = master.output();
                    responseMaster.password = master.password;
                    res.json(responseMaster);
                }
            );
        }
        catch (err) {
            error = err;
        }
    }

    if (error) {
        // render error
        route_index.json.index(req, res, error);
    }
}

function master(req, res) {
    var token = req.params.token,
        clientPort = req.params.clientPort,
        master,
        error = false;

    master = masterList.getMaster(clientPort);

    if (!master || token != master.token) {
        error = 'Invalid master.';
    }

    res.render('master', {error: error, master: master, masterStr: JSON.stringify(master.output())});
}

exports.master = master;
exports.json = {};
exports.json.createMaster = createMaster;