var async = require('async');
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');
var url = require('url');
var util = require('util');

// Make sure we handle errors
process.on('uncaughtException', function (err) {
  console.error(err.stack || err.toString());
});

// Access log
var log = process.env.NODE_LOG || __dirname + '/log/access.log';
var stream = fs.createWriteStream(log, { flags: 'a' });

var routes = [];

// Basic routing
function routeMatch(req, method, route) {
  if (!route || !req || !req.url) {
    return false;
  }
  var reqMethod = req.body._method || req.method;
  if (!reqMethod || (method !== 'all' && reqMethod.toString().toLowerCase() !== method)) {
    return false;
  }
  req.params = req.url.match(route);
  return !!req.params;
}

// Request helpers
function decorateRequest(req) {
  req.body = {};
  req.query = url.parse(req.url, true).query;
  req.param = function(key) {
    return req.params[key] || req.body[key] || req.query[key];
  };
  req.header = function (item) {
    return req.headers[item.toLowerCase()];
  };
}

// Response helpers
function decorateResponse(req, res) {
  var start = Date.now();
  var length = 0;

  var _write = res.write;
  res.write = function(chunk, encoding) {
    if (chunk) { length += chunk.length; }
    _write.apply(this, arguments);
  };

  var _end = res.end;
  res.end = function(data, encoding) {
    if (data) { length += data.length; }
    var line = util.format('[%s] %s %s %s "%s %s HTTP/%s" %s %s "%s" "%s" "%sms"\n',
      new Date().toUTCString(), req.connection.remoteAddress, req.headers.host || '-', req.headers['x-forwarded-for'] || '-',
      req.method, req.url, req.httpVersion, res.statusCode, length,
      req.headers.referer || '-', req.headers['user-agent'] || '-', Date.now() - start);
    stream.write(line);
    _end.apply(this, arguments);
  };

  res.send = function(data, status) {
    if (typeof status === 'undefined') { status = 200; }
    if (typeof data === 'object') {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      data = JSON.stringify(data);
    } else if (typeof data === 'string') {
      res.writeHead(status, { 'Content-Type': 'text/html' });
    } else if (typeof data === 'number') {
      res.writeHead(data, { 'Content-Type': 'text/plain' });
      data = '';
    }
    res.end(data);
  };
}

// Framework
var app = module.exports = http.createServer(function(req, res) {
  var body = '';

  // Grab the post body
  req.on('data', function(chunk) {
    body += chunk;
  });

  req.on('end', function() {
    decorateRequest(req);
    decorateResponse(req, res);

    // Parse the post body
    if (req.headers['content-type'] === 'application/json') {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        if (!app.set("quiet")) {
          console.warn("Invalid JSON: " + e);
        }
      }
    } else if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      try {
        req.body = querystring.parse(body);
      } catch(e) {
        if (!app.set("quiet")) {
          console.warn("Invalid form: " + e);
        }
      }
    }

    for (var index in routes) {
      var route = routes[index];

      if (routeMatch(req, route.method, route.url)) {
        async.forEachSeries(route.middleware,
          function(item, callback) {
            item(req, res, callback);
          },
          function(error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(error.stack || error.message);
          }
        );
        return;
      }
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('No route');
  });
});

// Settings
app.set = function(key, value) {
  this._settings = this._settings || {};
  if (typeof value !== 'undefined') {
    this._settings[key] = value;
  }
  return this._settings[key];
};


// Handlers for the various HTTP methods:
function handleMethod(m) {
  return function addRoute() {
    routes.push({url: arguments[0], middleware: Array.prototype.slice.call(arguments, 1), method: m});
  };
}


// Defined in HTTP/1.0:
app.get = handleMethod("get");
app.post = handleMethod("post");
app.head = handleMethod("head");

// Defined in HTTP/1.1:
app.put = handleMethod("put");
app.delete = app.del = handleMethod("delete");
app.patch = handleMethod("patch");

// Wildcard:
app.all = handleMethod("all");

if (require.main === module) {
  var port = process.env.NODE_PORT || 3000;
  
  // Dummy route
  app.get('^/$', function(req, res) {
    res.end('Hello World');
  });
  
  console.log("Listening on port " + port);
  app.listen(port);
}

