if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js');
}

describe('Index', function(){

  before(function(){
    this.client = new sage.Client('http://127.0.0.1:9200');
    this.index = this.client.index('sage-test');
  });

  before(forceDestroyIndex);

  beforeEach(function(){
    this.doc = { _id: '0', hello: 'World' };
    this.docs = [];
    for (var i = 1; i < 10; i++) {
      this.docs.push({ _id: '' + i, hello: 'World' + i });
    }
  });

  describe('#create', function(){
    it('should create index', function(done){
      this.index.create(function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
        }
        done(err);
      });
    });
  });

  describe('#destroy', function(){
    it('should destroy index', function(done){
      this.index.destroy(function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
        }
        done(err);
      });
    });
  });

  describe('utils', function(){
    before(createIndex);
    after(destroyIndex);

    isOk('refresh');
    isOk('close');
    isOk('open');
    isOk('flush');
    isOk('clear');
    isOk('optimize');
    isOk('snapshot');

    function isOk(method) {
      describe('#' + method, function(){
        it('should be ok', function(done){
          this.index[method](function(err, body, status, headers, res){
            if (!err) {
              shouldBeOk(body);
              shouldHave2xxStatus(status);
            }
            done(err);
          });
        });
      });
    }

  });

  describe('putting documents', function(){
    beforeEach(createIndex);
    afterEach(destroyIndex);

    describe('#post', function(){
      it('should store document', function(done){
        var doc = this.doc;
        delete doc._id;
        this.index.post('type1', doc, function(err, body, status, headers, res){
          if (!err) {
            shouldBeOk(body);
            expect(body).to.have.property('_index', 'sage-test');
            shouldHaveDocInfo(body, 'type1');
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

    describe('#put', function(){
      it('should store document', function(done){
        var doc = this.doc;
        this.index.put('type1', doc, function(err, body, status, headers, res){
          if (!err) {
            shouldBeOk(body);
            expect(body).to.have.property('_index', 'sage-test');
            shouldHaveDocInfo(body, 'type1', doc._id);
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

  });

  describe('getting documents', function(){
    before(createIndex);
    before(putDocument);
    after(destroyIndex);

    describe('#get', function(){
      it('should return document', function(done){
        var doc = this.doc;
        this.index.get('type1/' + doc._id, function(err, body, status, headers, res){
          if (!err) {
            expect(body).to.have.property('exists', true);
            expect(body).to.have.property('_source');
            shouldHaveDocInfo(body, 'type1', doc._id, doc._version);
            // shouldBeDocument(body._source, doc);
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

  });

  describe('updating documents', function(){
    before(createIndex);
    before(putDocument);
    after(destroyIndex);

    describe('#put', function(){
      it('should return document metadata', function(done){
        var doc = this.doc;
        this.index.put('type1', doc, function(err, body, status, headers, res){
          if (!err) {
            shouldBeOk(body);
            expect(body).to.have.property('_index', 'sage-test');
            shouldHaveDocInfo(body, 'type1', doc._id);
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

    describe('#del', function(){
      it('should be ok', function(done){
        var doc = this.doc;
        this.index.del('type1', doc, function(err, body, status, headers, res){
          if (!err) {
            shouldBeOk(body);
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

  });

  describe('batch', function(){
    beforeEach(createIndex);
    afterEach(destroyIndex);

    describe('#post', function(){
      it('should be ok', function(done){
        this.index.post('type1', this.docs, function(err, body, status, headers, res){
          if (!err) {
            expect(body).to.be.an('array');
            expect(body).to.have.length(9);
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

    describe('#del', function(){
      beforeEach(bulkDocuments);

      it('should be ok', function(done){
        var docs = this.docs;
        this.index.del('type1', docs, function(err, body, status, headers, res){
          var i = 0, len, item, doc;
          if (!err) {
            for (len = body.length; i < len; i++) {
              item = body[i], doc = docs[i];
              expect(item).to.have.property('delete');
              shouldBeOk(item.delete);
              shouldHaveDocInfo(item.delete, 'type1', doc._id, item._rev);
            }
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });

    });

  });

  describe('searching', function(){
    before(createIndex);
    before(bulkDocuments);
    before(refreshIndex);
    after(destroyIndex);

    describe('#find', function(){
      it('should find documents', function(done){
        var docs = this.docs
          , search = { query: { match_all: {} } };
        this.index.find(search, function(err, body, status, headers, res){
          var i = 0, len, item, doc;
          if (!err) {
            expect(body).to.be.an('array');
            expect(body).to.have.length(9);
            expect(body.took).to.be.ok();
            expect(body.timed_out).to.be(false);
            expect(body.hits).to.not.be(undefined);
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

  });

  function putDocument(done) {
    var doc = this.doc;
    this.index.put('type1', doc, function(err, body, status, headers, res){
      if (!err) {
        expect(body).to.have.property('_index', 'sage-test');
        shouldHaveDocInfo(body, 'type1', doc._id);
        doc._version = body._version;
      }
      done(err);
    });
  }

  function bulkDocuments(done) {
    this.index.post('type1', this.docs, done);
  }

  function shouldHaveDocInfo(item, type, id, version) {
    expect(item).to.have.property('_type', 'type1');
    expect(item).to.have.property('_id', id);
    expect(item).to.have.property('_version', version);
  }

});
