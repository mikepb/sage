if (typeof require != 'undefined') {
  var expect = require('expect.js');
}

(function(){

  this.forceDestroyDB = function(done) {
    this.db.destroy(function(){
      done();
    });
  };

  this.shouldBeOk = function(body) {
    expect(body).to.have.property('ok', true);
  };

  this.shouldHave2xxStatus = function(status) {
    expect(status).to.be.within(200, 299);
  };

})();
