var http = require('http');
var assert = require('assert');
var jinx = require("../index");

var PORT = 5050;

// Util function to do perform HTTP methods:
function doRequest(method, url, cb) {
  var req = http.request({
    hostname: 'localhost', 
    port: PORT, 
    path: url,
    method: method
  }, function (res) {
    
    if (res.statusCode !== 200) {
      return cb(new Error("Got non-200 status code: " + res.statusCode));
    }
    
    var data = "";
    
    res.on('data', function (chunk) {
      data += chunk;
    });
    
    res.on('end', function () {
      cb(null, data);
    });
  });
  
  req.on('error', cb);
  req.end();
}

describe("HTTP method routing", function () {
  
  before(function () {
    jinx.get("^/foo-get$",       function (req, res) { res.send("YEP::GET"); });
    jinx.post("^/foo-post$",     function (req, res) { res.send("YEP::POST"); });
    jinx.head("^/foo-head$",     function (req, res) { res.send("YEP::HEAD"); });
    jinx.put("^/foo-put$",       function (req, res) { res.send("YEP::PUT"); });
    jinx.del("^/foo-del$",       function (req, res) { res.send("YEP::DELETE"); });
    jinx.delete("^/foo-delete$", function (req, res) { res.send("YEP::DELETE"); });
    jinx.patch("^/foo-patch$",   function (req, res) { res.send("YEP::PATCH"); });
    
    jinx.all("^/foo-all$",       function (req, res) { res.send("YEP. THIS TOO."); });
    
    jinx.listen(PORT);
    return true;
  });
  
  // Will test for a correct response:
  function testMatch(method, path) {
    it("can route " + method + " requests correctly to " + path, function (done) {
      doRequest(method, path, function (err, data) {
        if (err) { return done(err); }
        assert.equal(data, "YEP::" + method, "Incorrect response value: " + data);
        done();
      });
    });
  }
  
  // Test for the simple method types:
  testMatch("GET",    "/foo-get");
  testMatch("POST",   "/foo-post");
  testMatch("PUT",    "/foo-put");
  testMatch("DELETE", "/foo-del");
  testMatch("DELETE", "/foo-delete");
  testMatch("PATCH",  "/foo-patch");
  
  // HEAD is a special case, as it doesn't have real data. Just make sure we got a 200:
  it("can route HEAD requests correctly to /foo-head", function (done) {
    doRequest("HEAD", "/foo-head", function (err, data) {
      if (err) { return done(err); }
      done();
    });
  });
  
  // Will test for an INCORRECT response:
  function testBadMatch(method, path) {
    it("will fail to route " + method + " requests to " + path, function (done) {
      doRequest(method, path, function (err, data) {
        if (err) { return done(); }
        done(new Error("Routed an incorrect method to an endpoint"));
      });
    });
  }
  
  testBadMatch("POST",   "/foo-get");
  testBadMatch("DELETE", "/foo-post");
  testBadMatch("PATCH",  "/foo-put");
  testBadMatch("GET",    "/foo-del");
  testBadMatch("PUT",    "/foo-delete");
  testBadMatch("DELETE", "/foo-patch");
  
});
