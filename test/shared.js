if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js');
}

(function(){

  this.sageFactory = function() {
    this.client = new sage.Client('http://127.0.0.1:9200');
    this.index = this.client.index('sage-test');
    this.type = this.index.type('type1');
  };

  this.docFactory = function() {
    this.doc = { _id: '0', hello: 'World' };
    this.docs = [];
    for (var i = 1; i < 10; i++) {
      this.docs.push({ _id: '' + i, hello: 'World' + i });
    }
  };

  this.forceDestroyIndex = function(done) {
    this.index.destroy(function(){
      done();
    });
  };

  this.createIndex = function(done) {
    this.index.create(done);
  };

  this.destroyIndex = function(done) {
    this.index.destroy(done);
  };

  this.refreshIndex = function(done) {
    this.index.refresh(done);
  };

  this.putDocument = function(done) {
    var doc = this.doc;
    this.type.put(doc, function(err, body, status, headers, res){
      if (!err) {
        expect(body).to.have.property('_index', 'sage-test');
        shouldHaveDocInfo(body, 'type1', doc._id);
        doc._version = body._version;
      }
      done(err);
    });
  };

  this.bulkDocuments = function(done) {
    this.type.post(this.docs, done);
  };

  this.shouldHaveDocInfo = function(item, type, id, version) {
    expect(item).to.have.property('_type', 'type1');
    expect(item).to.have.property('_id', id);
    expect(item).to.have.property('_version', version);
    expect(item.id).to.be(item._id);
    expect(item.version).to.be(item._version);
  };

  this.shouldBeOk = function(body) {
    expect(body).to.have.property('ok', true);
  };

  this.shouldHave2xxStatus = function(status) {
    expect(status).to.be.within(200, 299);
  };

})();
