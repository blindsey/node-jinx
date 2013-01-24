jinx
====

A stripped down web framework for node
--------------------------------------

Meant as a drop in replacement for express without named routing or error handling.

    var app = require('jinx');

    app.get(/^/$/, function(req, res) {
      res.end('Just testing bro');
    });

    app.post(/^/echo$/, function(req, res) {
      res.end(req.body);
    });

    app.get('/^middle$/, function(req, res, next) {
      console.log('Malcolm is here');
      next();
    }, function(req, res) {
      res.end('Middleware works');
    });

    app.listen(3000);
