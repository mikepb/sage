if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js');
}

describe('Index', function(){

  before(sageFactory);
  before(forceDestroyIndex);
  beforeEach(docFactory);

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

  describe('#map', function(){
    var mapping = {
      'type1': {
        properties: {
          foo: {
            type: 'integer'
          }
        }
      }
    };

    before(createIndex);
    after(destroyIndex);

    it('should create mapping', function(done){
      this.index.map('type1', mapping, function(err, body, status, headers, res){
        if (!err) shouldBeOk(body);
        done(err);
      });
    });

    it('should get mapping', function(done){
      this.index.map(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.eql({
            'sage-test': mapping
          })
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
            expect(body.took).to.be.a('number');
            expect(body.timed_out).to.be(false);
            expect(body.hits).to.not.be(undefined);
            shouldHave2xxStatus(status);
          }
          done(err);
        });
      });
    });

  });

});
