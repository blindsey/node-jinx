jinx
====

A stripped down web framework for node
--------------------------------------

Meant as a drop in replacement for express without view rendering, named routing, or error handling.

* Routes are always treated as regular expressions.
* req.body support for application/json and application/x-www-form-urlencoded POSTs.
* Method override can be used to send PUT/DELETE.
* req.header for accessing headers.
* req.param for accessing parameters.
* req.send detects payload type and encodes accordingly.
* Access logs with timing information.
* app.set(key, value)

    var app = require('jinx');
    app.set('message', 'Hello Bro!');

    app.get(/^/$/, function(req, res) {
      res.end(app.set('message'));
    });

    app.post(/^/echo$/, function(req, res) {
      res.send(req.body);
    });

    app.get('/^middle$/, function(req, res, next) {
      console.log('Malcolm is here');
      next();
    }, function(req, res) {
      res.send('Middleware works');
    });

    app.listen(3000);
