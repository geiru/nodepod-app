var modUseragent = require('useragent');

/**
 * Properties:
 * sessionId ... session id
 * userAgent ... full user-agent string send by browser
 * parsedUserAgent ... human readable user-agent, parsed with module useragent
 *
 * @param sessionId
 * @param userAgent
 * @constructor
 */
function Client(sessionId, userAgent, host) {
    if (typeof sessionId == 'undefined') {
        throw new Exception('Invalid sessionId');
    }
    if (typeof userAgent == 'undefined' || typeof userAgent != 'string') {
        throw new Exception('Invalid user-agent');
    }

    this.sessionId = sessionId;
    this.userAgent = userAgent;
    this.host = host;
    userAgent = modUseragent.parse(userAgent);
    this.parsedUserAgent =  userAgent.toAgent()+' / '+userAgent.os.toString()+' / '+userAgent.device.toString();
}

/**
 * Returns an object with only properties suitable for output.
 * The returned object does not contain:
 *  - the sessionId
 *
 * @returns {{}}
 */
Client.prototype.output = function() {
    var outputClient = {},
        key;

    for(key in this) {
        switch(key) {
            case 'sessionId':
                continue;
            default:
                outputClient[key] = this[key];
        }
    }

    return outputClient;
}
exports.Client = Client;