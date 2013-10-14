var modHttp = require('http'),
    modHttpProxy = require('http-proxy'),
    modUrl = require('url'),
    modUtil = require("util"),
    modEvents = require("events"),
    client_proxies = {},
    routingProxyOptions = {
        enable: {
            xforward: false     
        },
        changeOrigin: true      
    };

/**
 * Create a proxy that listens on the given port and host.
 *
 * The parameters urlObjAllowed, urlObjExcluded and urlObjDefaults denote the urls that are valid for the proxy.
 * This means that for any invalid url ClientProxy.setUrl will leave the internal url unchanged. The function
 * ClientProxy._filterUrlObj will return false for an url object of an invalid url.
 * See ClientProxy._filterUrlObj for more information on urlObjAllowed, urlObjectExcluded and urlObjDefaults.
 *
 *
 * @param port
 * @param host
 * @param emptyClientHtml
 * @param clientHeadHtml
 * @param urlObjAllowed restrict valid url; this must be an array of url objects (see module url)
 * @param urlObjExcluded exclude url from valid urls; this must be an array of url objects (see module url)
 * @param urlObjDefaults must be an url object (see module url)
 * @constructor
 */
ClientProxy = function(port, host, emptyClientHtml, clientHeadHtml, urlObjAllowed, urlObjExcluded, urlObjDefaults) {

    // call EventEmitter constructor
    modEvents.EventEmitter.call(this);

    if (client_proxies[port]) {
        throw new Error('This port is already in use!');
    }

    if (typeof urlObjAllowed == 'undefined' || !(urlObjectAllowed instanceof Array)) {
        urlObjAllowed = [{
            protocol: /https?:/
        }];
    }

    if (typeof urlObjExcluded == 'undefined') {
        urlObjExcluded = [];
    }

    if (typeof urlObjDefaults == 'undefined') {
        urlObjDefaults = {
            port: 80
        };
    }

    var self = this;
    
    // set port and host
    // TODO allow to run client proxy on ssl host?
    self.protocol = 'http';
    self.port = port;
    self.host = host;
    self.emptyClientHtml = emptyClientHtml;
    self.clientHeadHtml = clientHeadHtml;
    self.urlObjExcluded = urlObjExcluded;
    self.urlObjAllowed = urlObjAllowed;
    self.urlObjDefaults = urlObjDefaults;
    self._running = false;
    self._disabled = false;
    // initialize urlObj
    self.setUrl(false);

    // store reference to proxy    
    client_proxies[port] = self;
};

// inherit from EventEmitter
modUtil.inherits(ClientProxy, modEvents.EventEmitter);

/**
 * Set new url
 * parse url and store it in urlObj (see node module url)
 *
 * @param url
 * @return false if url was not valid and ClientProxy.urlObj remains unchanged; true if url was valid and the new url was stored in ClientProxy.urlObj
 */
ClientProxy.prototype.setUrl = function(url) {
    var newUrlObj = false;
    
    if (url) {
        newUrlObj = modUrl.parse(url);
        newUrlObj = this._filterUrlObj(newUrlObj);
    }

    if (newUrlObj) {
        this.urlObj = newUrlObj;
        return true;
    }
    else {
        return false;
    }


};

/**
 * Filters the urlObj (see module url) and returns
 *  - false if the urlObj was invalid (not allowed or excluded)
 *  - the urlObj with all defaults applied otherwise
 *
 * This function uses the properties ClientProxy.urlObjAllowed, ClientProxy.urlObjExcluded and ClientProxy.urlObjDefaults.
 * The allowed and excluded urlObjects are determined using the prototype function _matchFilterUrlObject().
 *
 *
 * @param urlObj
 * @return false if urlObj did not represent a valid url; the urlObj with all defaults applied otherwise
 * @private
 */
ClientProxy.prototype._filterUrlObj = function(urlObj) {
    var i, allowed, excluded;

    // check allowed
    if (this.urlObjAllowed.length > 0) {
        allowed = false;
        for(i = 0; i < this.urlObjAllowed.length; i++) {
            if (this._matchFilterUrlObject(this.urlObjAllowed[i], urlObj)) {
                allowed = true;
                break;
            }
        }

        if (!allowed) {
            return false;
        }
    }

    // check excluded
    if (this.urlObjExcluded.length > 0) {
        excluded = false;
        for(i = 0; i < this.urlObjExcluded.length; i++) {
            if (this._matchFilterUrlObject(this.urlObjExcluded[i], urlObj)) {
                excluded = true;
                break;
            }
        }

        if (excluded) {
            return false;
        }
    }

    // apply defaults
    urlObj = this._applyDefaultUrlObj(this.urlObjDefaults, urlObj);

    return urlObj;
}

/**
 * Checks if urlObj is matched by filterUrlObj.
 *
 * Wether an urlObj is matched or not is determined by the following algorithm:
 * Every property in filterUrlObj must be present in urlObj. If it is not present in urlObj, then urlObj is not matched.
 * For every property in filterUrlObj that is a string, the corresponding property in urlObj must be an equal string.
 * For every property in filterUrlObj that is a RegExp object, the corresponding property in urlObj must match the regular expression.
 *
 *
 * @param filterUrlObj
 * @param urlObj
 * @returns {boolean}
 * @private
 */
ClientProxy.prototype._matchFilterUrlObject = function(filterUrlObj, urlObj) {
    var p, prop, filter;

    for(p in filterUrlObj) {
        filter = filterUrlObj[p];

        if (typeof urlObj[p] != 'undefined') {
            prop = urlObj[p];
        }
        else {
            prop = false;
        }

        if (!prop || !this._applyFilter(filter, prop)) {
            return false;
        }
    }

    return true;
}

/**
 * Applies the filter to prop.
 *
 * @param filter
 * @param prop
 * @returns {boolean}
 * @private
 */
ClientProxy.prototype._applyFilter = function(filter, prop) {
    if (typeof filter == 'string') {
        return (filter == prop);
    }
    else if(filter instanceof RegExp) {
        return (prop.search(filter) != -1)
    }
    else {
        throw new Exception('Invalid Filter.');
    }

    return true;
}

/**
 * Applies default values to the urlObj.
 *
 * @param defaultUrlObj
 * @param urlObj
 * @returns {*}
 * @private
 */
ClientProxy.prototype._applyDefaultUrlObj = function(defaultUrlObj, urlObj) {
    var prop;

    for(prop in defaultUrlObj) {
        if (typeof urlObj[prop] == 'undefined' || urlObj[prop] === null) {
            urlObj[prop] = defaultUrlObj[prop];
        }
    }

    return urlObj;
}

// Get path part of url (including hash if addHash is true (default: false))
// See node module url.
ClientProxy.prototype.getPath = function(addHash) {
    if (typeof addHash == "undefined") {
        addHash = true;
    }
    
    if (this.urlObj && (this.urlObj.path || this.urlObj.hash)) {
        return (this.urlObj.path ? this.urlObj.path : '')+(this.urlObj.hash && addHash ? this.urlObj.hash : '');
    }
    else {
        return '';
    }    
}

/**
 * Starts the proxy server. Has no effect if the the proxy server is already listening.
 * Emit an 'start' event when the 'listening' event of the underlying http server s received.
 *
 * @param callback
 */
ClientProxy.prototype.start = function() {
    var self = this;

    if (self.isRunning()) {
        return;
    }

    // create routing proxy (from http-proxy module)
    self.proxy = new modHttpProxy.RoutingProxy(routingProxyOptions);

    // create the http server that listens on the given port
    self.server = modHttp.createServer(function (req, res) {
        var _write,
            _writeHead,
            basicAuth;

        if (self.urlObj) {
            // TODO check content type (html/text)
            if (req.url == self.getPath(false)) {
                var _write = res.write,
                    _writeHead = res.writeHead;

                // insert client script
                // and set base href // TODO replace if already existent
                res.write = function (data) {
                    // TODO treat content encoding other than utf-8
                    _write.call(res, data.toString().replace(/<\/head>/, self.clientHeadHtml+'</head>').replace(/<base.*>/, '<base href="'+self.protocol+'://'+self.host+':'+self.port+'/">'));
                }

                // delete header content-length
                res.writeHead = function(statusCode, reasonPhrase, headers) {
                    if (typeof reasonPhrase == 'object') {
                        headers = reasonPhrase;
                        reasonPhrase = undefined;
                    }

                    if (typeof headers != 'undefined' && headers['content-length']) {
                        delete headers['content-length'];
                    }

                    _writeHead.call(res, statusCode, reasonPhrase, headers);
                }

                // TODO: We don't want to have to deal with encoding (gzip, deflate, ...) here. Should we?
                if (req.headers['accept-encoding']) {
                    req.headers['accept-encoding'] = 'identity';
                }

            }

            // TODO receive from chrome extension
            if (typeof basicAuth == 'object' && basicAuth.username && basicAuth.password) {
                req.headers['Authorization'] = 'Basic ' + new Buffer(basicAuth.username + ':' + basicAuth.password).toString('base64');
            }

            // proxy the request via RoutingProxy
            self.proxy.proxyRequest(req, res, {
                host: self.urlObj.hostname,
                port: self.urlObj.port
            });
        }
        else {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8'
            });
            res.write(self.emptyClientHtml);
            res.end();
        }

    });


    self.server.on('listening', function() {
        self._running = true;

        self.emit('start');
    })

    self.server.listen(self.port, self.host);
}


/**
 * Stops the proxy server. Has no effect if called before the underlying http server started listening.
 * Emits an 'stop' event when the 'close' event of the underlying http server is received.
 *
 */
ClientProxy.prototype.stop = function() {
    var self = this;

    // check if client proxy is running
    if (!self.isRunning()) {
        return;
    }

    // on 'close' event of server
    self.server.on('close', function() {
        self._running = false;

        // unset reference to server
        delete self.server;
        // unset reference to proxy
        delete self.proxy;

        self.emit('stop');
    });

    // close the server
    self.server.close();
}

/**
 * Disables the client proxy. If it is still running, this function has no effect and false is returnend.
 * On success, true is returned.
 *
 * Ensure that the client proxy is not running, call stop() first.
 *
 * @returns {boolean}
 */
ClientProxy.prototype.disable = function() {

    if (this.isRunning()) {
        return false;
    }
    else if (!this.isDisabled()) {
        delete client_proxies[this.port];
        delete this.port;
        delete this.host;
        delete this.clientHeadHtml;
        delete this.emptyClientHtml;

        this.start = function() {
            throw new Error('This client proxy is disabled.');
        }

        this.stop = function() {
            throw new Error('This client proxy is disabled.');
        }
        this._disabled = true;

        return true;
    }

};

/**
 * Return true if client proxy is running.
 *
 * @returns boolean
 */
ClientProxy.prototype.isRunning = function() {
    return this._running;
}

/**
 * Return true if client proxy is disabled.
 *
 * @returns boolean
 */
ClientProxy.prototype.isDisabled = function() {
    return this._disabled;
}


exports.ClientProxy = ClientProxy;