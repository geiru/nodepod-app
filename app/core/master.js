var app_core = require(global.buildAppPath('app/core/core.js')),
    modUuid = require('node-uuid'),
    Client = require(global.buildAppPath('app/core/client.js')).Client;


/**
 * Properties:
 * clientPort ... port, that the ClientProxy uses
 * name ... name
 * password ... password
 * passwordRequired ... true if this master requires a password
 * token ... unique token, that the clients must use to connect to the master
 * host ... either the host, that the master runs on or false if the master is not connected
 * clientProxy ... a ClientProxy object (see app/core/client_proxy.js)
 * clientUrl ... url to client
 * socketConnectUrl ... url for socket.io connection
 * clients ... list of Client objects)
 *
 *
 * @param clientPort
 * @param name
 * @param password
 * @constructor
 */
function Master(clientPort, name, password) {
    this.clientPort = clientPort;
    if (!name) {
        this.name = 'master'+this.clientPort;
    }
    if (!password) {
        this.password = false;
    }
    else {
        this.password = password;
    }
    this.passwordRequired = (this.password !== false);
    this.token = generateToken();
    this.host = false;
    this.clientProxy = null;
    this.clientUrl = app_core.config.protocol+'://'+app_core.config.host+':'+app_core.config.port+'/client/'+this.clientPort;
    this.socketConnectUrl = app_core.config.protocol+'://'+app_core.config.host+':'+app_core.config.port+'?token='+this.token+'&clientPort='+this.clientPort+'&type=master';
    this.clients = {};

    // TODO move to client proxy
    this.excludes = [
        app_core.config.host+':'+app_core.config.port
    ];
    if (app_core.config.weinre.host && app_core.config.weinre.port) {
        this.excludes.push(app_core.config.weinre.host+':'+app_core.config.weinre.port);
    }

    //
    // helper functions
    //

    /**
     * generates token
     *
     * @returns {*}
     */
    function generateToken() {
        return modUuid.v4();
    }
}

/**
 * Returns true if the master is connected (host is not false)
 *
 * @returns {boolean}
 */
Master.prototype.isConnected = function() {
    return (this.host != false);
}

/**
 * Create and add a Client object to the list of clients (if not already in list)
 * @param sessionId
 * @param userAgent
 * @return the client
 */
Master.prototype.addClient = function(sessionId, userAgent, clientHost) {
    if (!this.clients[sessionId]) {
        this.clients[sessionId] = new Client(sessionId, userAgent, clientHost);
    }
    return this.clients[sessionId];
}

/**
 * Remove the Client object with given session id from list of clients
 * @param sessionId
 */
Master.prototype.removeClient = function(sessionId) {
    delete this.clients[sessionId];
}

/**
 * Returns an object with only properties suitable for output.
 * The returned object does not contain:
 *  - the ClientProxy object
 *  - the password
 *  - the sessionIds of the clients (the clients property is an array of objects returned by Client.prototype.output)
 *
 * @returns {{}}
 */
Master.prototype.output = function() {
    var outputMaster = {},
        key,
        sessionId,
        clients = [];

    for(key in this) {
        switch(key) {
            case 'clientProxy':
            case 'password':
                continue;
            case 'clients':
                for(sessionId in this.clients) {
                    clients.push(this.clients[sessionId].output());
                }
                outputMaster.clients = clients;
                break;
            default:
                outputMaster[key] = this[key];
        }
    }

    return outputMaster;
}

exports.Master = Master;