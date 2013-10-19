if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js');
}

describe('Type', function(){

  before(sageFactory);
  before(forceDestroyIndex);
  beforeEach(docFactory);

  describe('putting documents', function(){
    beforeEach(createIndex);
    afterEach(destroyIndex);

    describe('#post', function(){
      it('should store document', function(done){
        var doc = this.doc;
        delete doc._id;
        this.type.post(doc, function(err, body, status, headers, res){
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
        this.type.put(doc, function(err, body, status, headers, res){
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
    before(bulkDocuments);
    after(destroyIndex);

    describe('#get', function(){
      it('should return document', function(done){
        var doc = this.doc;
        this.type.get(doc._id, function(err, body, status, headers, res){
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

    describe('#mlt', function(){
      it('should wait for index to build', function(done){
        this.slow(3000); setTimeout(done, 1000);
      });
      it('should accept more-like-this query', function(done){
        var doc = this.doc;
        this.type.mlt(doc._id, {
          mlt_fields: ['text'],
          min_doc_freq: 1
        }, function(err, body, status, headers, res){
          if (!err) {
            expect(body).to.have.length(9);
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
        this.type.put(doc, function(err, body, status, headers, res){
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

    describe('#up', function(){
      it('should return document metadata', function(done){
        var doc = { script: 'ctx._source.foobar = "baz"' };
        this.type.up('0', doc, function(err, body, status, headers, res){
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
        this.type.del(doc, function(err, body, status, headers, res){
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
        this.type.post(this.docs, function(err, body, status, headers, res){
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
        this.type.del(docs, function(err, body, status, headers, res){
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

});
