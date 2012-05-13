var zombie = require("zombie")
  , expect = require("expect.js")
  , express = require('express');

describe('zombie', function(){

  before(function(done){
    this.port = parseInt(Math.random() * 9000, 10) + 1000;
    this.uri = 'http://127.0.0.1:' + this.port;
    this.app = express.createServer();
    this.app.use(express.static(__dirname));
    this.server = this.app.listen(this.port, done);
  });

  after(function(){
    this.server.close();
  });

  beforeEach(function(){
    this.browser = new zombie();
  });

  xit('should pass tests', visit('/'));
  xit('should pass tests for minified version', visit('/index-min.html'));

  function visit(uri) {
    return function(done) {
      this.timeout(10000);
      this.browser.visit(this.uri + uri, function(err, browser){
        if (err) return done(err);
        browser.wait(function(err, browser){
          if (err) return done(err);
          expect(browser.success).to.be.ok();
          expect(browser.errors).to.be.empty();
          expect(browser.queryAll('.test.fail')).is.empty();
        });
      });
    };
  }

});
