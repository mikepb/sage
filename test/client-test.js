if (typeof require != 'undefined') {
  var sage = require('..')
    , expect = require('expect.js');
}

describe('Client', function(){
  before(sageFactory);

  describe('#index', function(){
    it('should return Index object', function(){
      var index = this.client.index('test');
      expect(index).to.be.a(sage.Index);
      expect(index).to.have.property('uri', 'http://127.0.0.1:9200/test');
    });
  });

  describe('#stats', function(){
    it('should return node stats', function(done){
      this.client.stats(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('cluster_name');
          expect(body).to.have.property('nodes');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#health', function(){
    it('should return cluster health', function(done){
      this.client.health(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('active_shards');
          expect(body).to.have.property('cluster_name');
          expect(body).to.have.property('status');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#state', function(){
    it('should return cluster state', function(done){
      this.client.state(function(err, body, status, headers, res){
        if (!err) {
          expect(body).to.have.property('metadata');
          expect(body).to.have.property('master_node');
          expect(body).to.have.property('nodes');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#nodes', function(){
    it('should return cluster nodes', function(done){
      this.client.nodes(function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
          expect(body).to.have.property('cluster_name');
          expect(body).to.have.property('nodes');
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });
  });

  describe('#config', function(){

    it('should update cluster settings', function(done){
      var settings = { transient: { index: { number_of_replicas: 1 } } };
      this.client.config(settings, function(err, body, status, headers, res){
        if (!err) {
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });

    it('should return cluster settings', function(done){
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


  describe('#tmpl', function(){

    it('should update template', function(done){
      var template = {
        template: '*',
        mappings: {
          twitter: {
            _source: { enabled: false }
          }
        }
      };
      this.client.tmpl('test', template, function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });

    it('should return template', function(done){
      this.client.tmpl('test', function(err, body, status, headers, res){
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

    it('should delete template', function(done){
      this.client.untmpl('test', function(err, body, status, headers, res){
        if (!err) {
          shouldBeOk(body);
          shouldHave2xxStatus(status);
        }
        done(err);
      });
    });

  });

});
