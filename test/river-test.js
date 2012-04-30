if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js');
}

describe('Client#river', function(){
  before(sageFactory);

  it('should create river', function(done){
    var meta = { type: 'dummy' };
    this.client.river('sage-river', meta, function(err, body, status, headers, res){
      if (!err) {
        shouldBeOk(body);
        expect(body).to.have.property('_id', '_meta');
        expect(body).to.have.property('_index', '_river');
        expect(body).to.have.property('_type', 'sage-river');
        expect(body).to.have.property('_version', 1);
      }
      done(err);
    });
  });

  it('should destroy river', function(done){
    this.client.unriver('sage-river', function(err, body, status, headers, res){
      if (!err) {
        shouldBeOk(body);
      }
      done(err);
    });
  });

});
