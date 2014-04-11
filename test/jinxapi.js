var http = require('http');
var assert = require('assert');
var jinx = require("../index");

var PORT = 5052;

// Util function to do perform HTTP methods:
function doRequestHead(url, cb) {
  var req = http.request({
    hostname: '127.0.0.1', 
    port: PORT, 
    path: url,
    method: "HEAD"
  }, function (res) {
    
    if (res.statusCode !== 200) {
      return cb(new Error("Got non-200 status code: " + res.statusCode));
    }
    
    res.on('end', function () {
      cb(null, res.headers);
    });
  });
  
  req.on('error', cb);
  req.end();
}

describe("The X-Powered-By header", function () {
  
  // Create a super simple server:
  before(function () {
    jinx.all("^/blah-blah$", function (req, res) { res.send("BEEP"); });
    
    jinx.listen(PORT);
    return true;
  });

  // Make sure we start with the ad enabled:
  beforeEach(function (done) {
    jinx.set("showJinxAd", true);
    done();
  });

  // Shut it down when we're done:
  after(function (done) {
    jinx.close(done);
  });

  it("is enabled by default", function (done) {
    doRequestHead("/blah-blah", function (err, headers) {
      assert.equal(headers["x-powered-by"], "node-jinx");
      done();
    });
  });

  it("can be disabled", function (done) {
    jinx.set("showJinxAd", false);
    doRequestHead("/blah-blah", function (err, headers) {
      assert.equal(headers["x-powered-by"], undefined);
      done();
    });
  });
});
