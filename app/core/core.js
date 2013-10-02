// parse command line parameters
var argv = require('optimist')
    .usage('\n\nUsage: $0')
    .demand(['h','p'])
    .alias('h', 'host')
    .alias('p', 'port')
    .alias('i', 'weinre_host')
    .alias('q', 'weinre_port')
    .describe('h', 'address that the app is running on')
    .describe('p', 'port that the app is listening on')
    .describe('i', 'address that the weinre debug server is running on (skip if no weinre or if this is the same as h)')
    .describe('q', 'port that the weinre debug server is listening on (skip if no weinre)')
    .argv;

// load package json to access information about own module
var package_json = require(global.buildAppPath('package.json')),
    modUuid = require('node-uuid'),
    Master = require(global.buildAppPath('app/core/master.js')).Master,
    config = {
        port: argv.p,
        host: argv.h,
        protocol: 'http',
        app_name: package_json.name,
        app_version: package_json.version,
        require_master_passwords: false, // TODO implement access to clients with password (use express session)
        express: {
            session: {
                secret: modUuid.v4(),
                key: package_json.name+'.sid'
            }
        },
        weinre: {
            host: (argv.i ? argv.i : argv.h),
            port: argv.q,
            protocol: 'http'
        }
    };

// export config
exports.config = config;

// export list of masters
exports.masterList = {

    masters: {},

    /**
     *
     * @param master
     * @return int clientPort
     */
    addMaster: function(master) {
        if (!(master instanceof Master)) {
            throw new Exception('Invalid master.');
        }

        this.masters[master.clientPort] = master;
        return master.clientPort;
    },

    removeMaster: function(clientPort) {
        delete this.masters[clientPort];
    },

    getMaster: function(clientPort) {
        if (this.masters[clientPort]) {
            return this.masters[clientPort];
        }
        else {
            return false;
        }

    },

    /**
     * Itarates over all masters in masterList.
     *
     * @param callback function, that expects a master as first parameter
     */
    each: function(callback) {
        var clientPort;

        for(clientPort in this.masters) {
            callback(this.masters[clientPort]);
        }
    },

    getNextClientPort: function() {
        var maxPort = parseInt(config.port);

        for(clientPort in this.masters) {
            clientPort = parseInt(clientPort);
            if (clientPort > maxPort) {
                maxPort = clientPort;
            }
        }

        return maxPort + 1;
    }
};