0.4.2 / 2013-10-19
==================

  * Add `type.mlt()` for more-like-this-query


0.4.1 / 2013-10-07
==================

  * Save type name as `this.name` as in online docs and to avoid conflict
    with `index.type()`


0.4.0 / 2013-10-07
==================

  * Accept scalar types for IDs
  * Fix bug in getting mapping
  * Fix source documentation for putting mapping


0.3.0 / 2013-03-01
==================

  * [#1] Make `Type` methods callable on `Index` where appropriate


0.2.2 / 2013-02-22
==================

  * Fix ElasticSearch update API usage
  * Accept doc._id or doc.id for `Type#put`, `Type#del` and `Type#up`


0.2.1 / 2013-02-21
==================

  * `Type#up` method provides access to ElasticSearch update API


0.2.0 / 2013-02-20
==================

  * Use unnamed functions
  * Update dependencies


0.1.2 / 2012-05-19
==================

  * Return server errors as errors


0.1.1 / 2012-05-12
==================

  * Fixed URI parsing on node side
  * Added uglify-js dependency
  * Removed useless zombie.js tests


0.1.0 / 2012-05-04
==================

  * Initial release
