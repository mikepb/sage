if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js')
    , sinon = require('sinon')
    , fs = require('fs');
}

describe('sage', function(){

  it('should delegate to sage.make()', function(){
    sinon.spy(sage, 'make');
    sage();
    expect(sage.make.calledOnce).to.be.ok();
    sage.make.restore();
  });

  if (fs) describe('package', function(){

    before(function(done){
      var self = this;
      fs.readFile('package.json', function(err, source){
        self.source = source.toString();
        done(err);
      });
    });

    before(function(){
      this.package = JSON.parse(this.source);
    });

    it('should match package.json version', function(){
      expect(sage).to.have.property('version', this.package.version);
    });

  });

  describe('#make', function(){

    it('should make client', function(){
      var client = sage.make();
      expect(client).to.be.a(sage.Client);
      expect(client).to.have.property('uri', typeof window == 'undefined' ? '' : 'http://127.0.0.1:9200');
    });

    it('should make client with URI', function(){
      var client = sage.make('http://127.0.0.1:9200');
      expect(client).to.be.a(sage.Client);
      expect(client).to.have.property('uri', 'http://127.0.0.1:9200');
    });

    it('should make index with URI', function(){
      var index = sage.make('http://127.0.0.1:9200/test');
      expect(index).to.be.a(sage.Index);
      expect(index).to.have.property('uri', 'http://127.0.0.1:9200/test');
    });

  });

});
