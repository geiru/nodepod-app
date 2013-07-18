var app_core = require(global.buildAppPath('app/core/core.js')),
    masterList = app_core.masterList,
    app_express = require(global.buildAppPath('app/express/express.js')),
    modSocketio = require('socket.io'),
    modCookie = require('cookie'),
    modConnect = require('connect');

socketio = modSocketio.listen(app_express.server, {log: true});

// configure socket.io
// socket authorization via clientPort and token
socketio.configure(function() {
    socketio.set('authorization', function(handshakeData, callback) {
        var clientPort = null,
            token = null,
            type = 'index',
            master = null,
            cookie = null,
            sessionId;

        if (handshakeData.query['type']) {
            type = handshakeData.query['type'];
        }

        if (type != 'master' && type != 'client' && type != 'index') {
            type = 'index';
        }


        if (type == 'index') {
            handshakeData.type = type;
            callback(null, true);
            return;
        }
        else {
            // get clientPort and token from query
            if (handshakeData.query['clientPort']) {
                clientPort = handshakeData.query['clientPort'];
                master = masterList.getMaster(clientPort);
            }
            if (handshakeData.query['token']) {
                token = handshakeData.query['token'];
            }

            // check for valid clientPort and token
            if (!clientPort || !master) {
                callback('Invalid clientPort.', false);
                return;
            }
            else if (!token || master.token != token) {
                callback('Invalid token.', false);
                return;
            }
            else {
                switch(type) {
                    case 'master':
                        if (master.isConnected()) {
                            callback('Master already connected.', false);
                            return;
                        }
                        else {
                            master.host = handshakeData.address.address;
                        }
                        break;
                    case 'client':
                        // check session
                        if (!handshakeData.headers.cookie) {
                            callback('Couldn\'t find session.', false);
                            return;
                        }
                        else {
                            // get session id from cookie
                            // if a valid session id is found, we
                            cookie = modCookie.parse(handshakeData.headers.cookie);
                            sessionId = modConnect.utils.parseSignedCookie(cookie[app_core.config.express.session.key], app_core.config.express.session.secret);
                            // sessionId must be different than session id from unparsed cookie
                            if (cookie[app_core.config.express.session.key] == sessionId) {
                                callback('Invalid session cookie.', false);
                                return;
                            }
                            else {
                                handshakeData.sessionId = sessionId;
                            }
                        }
                        break;
                }

                handshakeData.type = type;
                handshakeData.clientPort = clientPort;
                callback(null, true);
            }
        }
    });
});

socketio.sockets.on('connection', function(socket) {
    var clientPort, room, master;


    if (socket.handshake.type == 'index') {
        // join room 'index'
        socket.join('index');
    }
    else {
        clientPort = socket.handshake.clientPort;
        room = clientPort;
        master = masterList.getMaster(clientPort);

        // join the room
        socket.join(room);


        if (socket.handshake.type == 'master') {
            // send updateMaster message to clients and index pages
            sendUpdateMaster(master, room, true);

            socket.on('reconnect', function() {
                // update master
                master.host = socket.handshake.address.address;
                // send updateMaster message to clients and index pages
                sendUpdateMaster(master, room, true);
            });

            socket.on('disconnect', function() {
                // update master
                master.host = false;
                // send updateMaster message to clients and index pages
                sendUpdateMaster(master, room, true);
            });

            // listen for master events
            socket.on('updateUrl', function(data) {
                if (data.url) {
                    // set url in client proxy
                    if (master.clientProxy.setUrl(data.url)) {
                        // send refresh message to all clients in this room
                        socketio.sockets['in'](room).emit('reload', {
                            href: master.clientProxy.getPath()
                        });
                    };
                }
            });

            socket.on('click', function(data) {
                if (data.element) {
                    // send click message to all clients in this room
                    socketio.sockets['in'](room).emit('click', data);
                }
            });
        }
        else {
            // add new client to client list of master
            master.addClient(socket.handshake.sessionId, socket.handshake.headers['user-agent'], socket.handshake.address.address);

            // send updateMaster message to master, clients and index pages
            sendUpdateMaster(master, room, true);

            // listen for client events

        }
    }
});


/**
 * Sends updateMaster message to master, clients and index pages (if index == true)
 *
 * @param master Master object
 * @param room room to send updateMaster message to
 * @param index if true, sends updateMaster message to index pages
 */
function sendUpdateMaster(master, room, index)
{
    var outputMaster;

    if (typeof index == 'undefined') {
        index = true;
    }

    outputMaster = master.output();
    socketio.sockets['in'](room).emit('updateMaster', {
        master: outputMaster
    });
    socketio.sockets['in']('index').emit('updateMaster', {
        master: outputMaster
    });
}
