var ClientProxy = require('../app/core/client_proxy.js').ClientProxy
    modHttp = require('http');

exports.group = {

    setUp: function(callback) {
        // create client proxy
        this.clientProxy = new ClientProxy(3333, 'localhost', 'empty', 'head');

        callback();
    },

    tearDown:  function(callback) {

        // stop client proxy
        if (this.clientProxy.isRunning()) {
            this.clientProxy.stop();
        }

        // and disable it
        if (!this.clientProxy.isDisabled()) {
            this.clientProxy.disable();
        }

        delete this.clientProxy;

        callback();
    },

    testCreate: function(test) {
        test.expect(2);

        // check if client proxy was created properly
        test.ok((this.clientProxy instanceof ClientProxy), 'An instance of ClientProxy should be created');

        // check if trying to create another client proxy with same port throws an error
        test.throws(
            function() {
                var samePortClientProxy = new ClientProxy(3333, 'localhost', 'empty2', 'head2');
            },
            function(err) {
                if ((err instanceof Error) && err.message == 'This port is already in use!' ) {
                    return true;
                }
            },
            'An error should be thrown'
        );

        test.done();
    },

    testStartStopDisable: function(test) {
        var self = this;

        test.expect(10);

        self.clientProxy.on('start', function() {
            test.ok(self.clientProxy.isRunning(), 'Client proxy should be running');

            test.ok(!self.clientProxy.disable(), 'Client proxy should not be disabled');
            test.ok(!self.clientProxy.isDisabled(), 'Client proxy should not be disabled');

            test.doesNotThrow(
                function() {
                    self.clientProxy.stop();
                },
                'No error should be thrown'
            );
        });

        self.clientProxy.on('stop', function() {
            test.ok(!self.clientProxy.isRunning(), 'Client proxy should not be running');

            test.ok(self.clientProxy.disable(), 'Client proxy should be disabled');
            test.ok(self.clientProxy.isDisabled(), 'Client proxy should be disabled');

            test.throws(
                function() {
                    self.clientProxy.start();
                },
                function(err) {
                    if ((err instanceof Error) && err.message == 'This client proxy is disabled.' ) {
                        return true;
                    }
                },
                'An error should be thrown'
            );

            test.throws(
                function() {
                    self.clientProxy.stop();
                },
                function(err) {
                    if ((err instanceof Error) && err.message == 'This client proxy is disabled.' ) {
                        return true;
                    }
                },
                'An error should be thrown'
            );

            test.done();
        });

        test.doesNotThrow(
            function() {
                self.clientProxy.start();
            },
            'No error should be thrown'
        );
    },

    testEmptyClient: function(test) {
        var self = this;

        test.expect(2);

        self.clientProxy.on('start', function() {
           modHttp.get('http://localhost:3333', function(res) {
               var responseText = '';

               test.ok(res.statusCode == 200, 'Status code should be 200');

               res.on('data', function(data) {
                   responseText += data.toString();
               });

               res.on('end', function() {
                   test.equal(responseText, 'empty', 'Response should be \'empty\'');

                   self.clientProxy.stop();
               });
           });
        });

        self.clientProxy.on('stop', function() {
            test.done();
        });

        this.clientProxy.start();
    },

    testClient: function(test) {
        var self = this,
            testServer = createTestServer();


        test.expect(3);

        self.clientProxy.on('start', function() {
            modHttp.get('http://localhost:3333', function(res) {
                var responseText = '';

                test.ok(res.statusCode == 200, 'Status code should be 200');

                res.on('data', function(data) {
                    responseText += data.toString();
                });

                res.on('end', function() {
                    test.equal(responseText, '<html><head><title>Test</title>head</head><body>Test</body></html>', 'Response should contain \'head\'');

                    self.clientProxy.stop();
                });
            });
        });

        self.clientProxy.on('stop', function() {
            testServer.close();
            test.done();
        });

        test.strictEqual(this.clientProxy.setUrl('http://localhost:4444'), true, 'setUrl should return true');

        this.clientProxy.start();

    },

    testFilterUrl: function(test) {
        var urlObj;


        test.expect(25);

        // built-in filters
        test.strictEqual(this.clientProxy.setUrl('http://localhost:4444'), true, 'only http and https are allowed');
        test.strictEqual(this.clientProxy.setUrl('https://localhost:4444'), true, 'only http and https are allowed');
        test.strictEqual(this.clientProxy.setUrl('abc://localhost:4444'), false, 'only http and https are allowed');
        test.strictEqual(this.clientProxy.setUrl('abchttpabc://localhost:4444'), false, 'only http and https are allowed');
        test.strictEqual(this.clientProxy.setUrl('localhost:4444'), false, 'the protocol is required');
        test.strictEqual(this.clientProxy.setUrl('http://localhost'), true, 'setUrl should return true');
        test.equal(this.clientProxy.urlObj.port, 80, 'built-in default port is 80');

        // defaults
        this.clientProxy.urlObjDefaults = {
            port: 1234
        };
        test.strictEqual(this.clientProxy.setUrl('http://localhost'), true, 'setUrl should return true');
        test.equal(this.clientProxy.urlObj.port, 1234, 'default port is now 1234');


        // allowed urls
        this.clientProxy.urlObjExcluded = [];
        this.clientProxy.urlObjDefaults = {
            port: '80'
        };
        this.clientProxy.urlObjAllowed = [{
            protocol: /^a.+:$/,
            hostname: /^(foo|bar)$/,
            port: '5555'
        }, {
            protocol: 'a:',
            hostname: 'b',
            port: '1234'
        }];
        test.strictEqual(this.clientProxy.setUrl('http://localhost'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('abc://foo'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('aaaa://bar:1234'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('a://foo:5555'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('abc://foobar:5555'), false, 'setUrl should return false');

        test.strictEqual(this.clientProxy.setUrl('abc://foo:5555'), true, 'setUrl should return true');
        test.strictEqual(this.clientProxy.setUrl('aaaa://bar:5555'), true, 'setUrl should return true');
        test.strictEqual(this.clientProxy.setUrl('a://b:1234'), true, 'setUrl should return true');


        // excluded urls
        this.clientProxy.urlObjAllowed = [];
        this.clientProxy.urlObjDefaults = {
            port: '80'
        };
        this.clientProxy.urlObjExcluded = [{
            protocol: 'https:'
        }, {
            port: /^(1234|4321)$/
        }, {
            hostname: 'abc.def'
        }, {
            protocol: 'http:',
            hostname: 'foo.bar',
            port: '99'
        }];
        test.strictEqual(this.clientProxy.setUrl('https://abc'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('https://abc:4444'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('http://abc:4321'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('http://abc.def:4444'), false, 'setUrl should return false');
        test.strictEqual(this.clientProxy.setUrl('http://foo.bar:99'), false, 'setUrl should return false');

        test.strictEqual(this.clientProxy.setUrl('http://foo.bar:80'), true, 'setUrl should return true');
        test.strictEqual(this.clientProxy.setUrl('http://bar:5555'), true, 'setUrl should return true');
        test.strictEqual(this.clientProxy.setUrl('foo://bar:80'), true, 'setUrl should return true');

        test.done();
    }

}

function createTestServer()
{
    return modHttp.createServer(function(req, res) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('<html><head><title>Test</title></head><body>Test</body></html>');
    }).listen(4444, 'localhost');
}