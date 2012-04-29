if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js');
}

describe('Client', function(){

  before(function(){
    this.client = new sage.Client('http://127.0.0.1:9200');
  });

  describe('#index', function(){
    it('should return Index object', function(){
      var index = this.client.index('test');
      expect(index).to.be.a(sage.Index);
      expect(index).to.have.property('uri', 'http://127.0.0.1:9200/test');
    });
  });

  describe('#stats', function(){
    it('shoud return node stats', function(done){
      this.client.stats(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('cluster_name', 'elasticsearch');
          expect(body).to.have.property('nodes');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#health', function(){
    it('shoud return cluster health', function(done){
      this.client.health(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('active_shards');
          expect(body).to.have.property('cluster_name', 'elasticsearch');
          expect(body).to.have.property('status');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#state', function(){
    it('shoud return cluster state', function(done){
      this.client.state(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('cluster_name', 'elasticsearch');
          expect(body).to.have.property('master_node');
          expect(body).to.have.property('nodes');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#nodes', function(){
    it('shoud return cluster nodes', function(done){
      this.client.nodes(function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
          expect(body).to.have.property('cluster_name', 'elasticsearch');
          expect(body).to.have.property('nodes');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#config', function(){
    it('shoud return cluster settings', function(done){
      this.client.config(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('persistent');
          expect(body).to.have.property('transient');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#configure', function(){
    it('shoud update cluster settings', function(done){
      var settings = { transient: { index: { number_of_replicas: 1 } } };
      this.client.configure(settings, function(err, body, status, headers, res){
        if (!err) {
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });


  describe('#template', function(){

    it('shoud update template', function(done){
      var template = {
        template: '*',
        mappings: {
          twitter: {
            _source: { enabled: false }
          }
        }
      };
      this.client.template('test', template, function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });

    it('shoud return template', function(done){
      this.client.templ('test', function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('test');
          expect(body.test).to.have.property('template', '*');
          expect(body.test.mappings).to.have.property('twitter');
          expect(body.test.mappings.twitter).to.have.property('_source');
          expect(body.test.mappings.twitter._source).to.have.property('enabled', false);
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });

    it('shoud delete template', function(done){
      this.client.template('test', null, function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });

  });

});
