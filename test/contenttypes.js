var http = require('http');
var assert = require('assert');
var jinx = require("../index");

var PORT = 5051;

// Util function to do perform HTTP POSTs:
function doRequest(content_type, url, post_data, cb) {
  var req = http.request({
    hostname: '127.0.0.1', 
    port: PORT,
    path: url,
    headers: {"Content-Type": content_type},
    method: "POST"
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
  req.write(post_data);
  req.end();
}


describe("Content-Type handling", function () {
  
  before(function () {
    
    // Shut the error messages up:
    jinx.set("quiet", true);

    // This endpoint will test the application/json encoding type:
    jinx.post("^/endpoint/json$", function (req, res) {
      assert.equal(req.headers["content-type"], "application/json", "Request has a non-json content-type.");
      assert.equal(req.body.hello, "world",       "Request is missing data. (hello world)");
      assert.equal(req.body.abc, 123,             "Request is missing data. (abc 123)");
      assert.equal(req.body["cool story"], "BRO", "Request is missing data. (CSB)");
      res.end("OK");
    });
    
    // This endpoint will receive a malformed application/json payload:
    jinx.post("^/endpoint/json/bad$", function (req, res) {
      assert.equal(req.headers["content-type"], "application/json", "Request has a non-json content-type.");
      assert.equal(typeof req.body, "object",       "Request is missing data. (hello world)");
      assert.equal(Object.keys(req.body).length, 0, "Malformed request has parsed data in it.");
      res.end("OK");
    });
    
    // This endpoint will test the application/x-www-form-urlencoded encoding type:
    jinx.post("^/endpoint/form$", function (req, res) {
      assert.equal(req.headers["content-type"], "application/x-www-form-urlencoded", "Request has a non-urlencoded content-type.");
      assert.equal(req.body.hello, "world",     "Request is missing data. (hello world)");
      assert.equal(req.body.abc, "1 2 3",       "Request is missing data. (abc 1 2 3)");
      res.end("OK");
    });
    
    jinx.listen(PORT);
    return true;
  });
  
  after(function (done) {
    jinx.close(done);
  });
  
  it("will correctly handle a JSON payload", function (done) {
    var json_data = '{"hello": "world", "abc": 123, "cool story": "BRO"}';
    doRequest("application/json", "/endpoint/json", json_data, function (err, data) {
      if (err) { return done(err); }
      assert.equal(data, "OK", "Server responded with a non-OK string.");
      done();
    });
  });
  
  it("will reject a malformed JSON payload", function (done) {
    var json_data = '{hello: "world", abc: 123, cool story: "BRO"}';
    doRequest("application/json", "/endpoint/json/bad", json_data, function (err, data) {
      if (err) { return done(err); }
      assert.equal(data, "OK", "Server responded with a non-OK string.");
      done();
    });
  });
  
  it("will correctly handle a URL-encoded payload", function (done) {
    var post_data = 'hello=world&abc=1%202%203';
    doRequest("application/x-www-form-urlencoded", "/endpoint/form", post_data, function (err, data) {
      if (err) { return done(err); }
      assert.equal(data, "OK", "Server responded with a non-OK string.");
      done();
    });
  });
  
});
