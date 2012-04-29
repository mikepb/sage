/*
(c) Michael Phan-Ba
github.com/mikepb/snap
Apache License
*/

;(function(
  module,
  encodeURI,
  encodeURIComponent,
  decodeURIComponent
){

  var global = this;
  var previousSage = this.sage; this.sage = sage;

  if (module) module.exports = sage;

  /**
   * Copy properties from sources to target.
   *
   * @param {Object} target The target object.
   * @param {Object...} sources The source object.
   * @return {Object} The target object.
   * @api private
   */

  function extend(target /* sources.. */) {
    var source, key, i = 1;
    while (source = arguments[i++]) {
      for (key in source) target[key] = source[key];
    }
    return target;
  }

  /**
   * Stringify value.
   *
   * @param {Object} that That value to stringify.
   * @return {String} The stringifyed value.
   * @api private
   */

  function asString(that) {
    return Object.prototype.toString.call(that);
  }

  /**
   * Check if value is a string.
   *
   * @param {Object} that That value to check.
   * @return {Boolean} `true` if string, `false` otherwise.
   * @api private
   */

  function isString(that) {
    return asString(that) == '[object String]';
  }

  /**
   * Check if value is an object.
   *
   * @param {Object} that That value to check.
   * @return {Boolean} `true` if object, `false` otherwise.
   * @api private
   */

  function isObject(that) {
    return asString(that) == '[object Object]';
  }

  /**
   * Check if value is an array.
   *
   * @param {Object} that That value to check.
   * @return {Boolean} `true` if array, `false` otherwise.
   * @api private
   */

  function isArray(that) {
    return asString(that) == '[object Array]';
  }

  /**
   * Check if value is a function.
   *
   * @param {Object} that That value to check.
   * @return {Boolean} `true` if function, `false` otherwise.
   * @api private
   */

  function isFunction(that) {
    return asString(that) == '[object Function]';
  }

  /**
   * Sage library entry point.
   *
   * @param {Array|Object|String} servers List of node URIs or map of named
   *   nodes to URIs or a single URI.
   * @return {Client|Function} If a list of servers is given, returns a
   *   function to select a client, otherwise returns the client.
   */

  function sage(servers) {
    if (!servers || isString(servers)) {
      return sage.make(servers);
    }

    var serverNames = [], name, i = 0, len;

    for (name in servers) {
      servers[name] = sage.make(servers[name]);
      serverNames.push(name);
    }

    len = serverNames.length;

    return function(name) {
      var server;
      if (!name) { name = serverNames[i++]; i %= len; }
      if (!(server = servers[name])) throw new Error('no server configured');
      return server;
    };
  }

  /**
   * Restore global variable `sage` to original value.
   *
   * @return {sage} The `sage` library as an object.
   */

  sage.noConflict = function() {
    global.sage = previousSage;
    return sage;
  };

  /**
   * Library version.
   */

  sage.version = '0.0.0';

  /**
   * Create single ElasticSearch client.
   *
   * @param {String} uri Fully qualified URI.
   * @return {Client|Database} If `uri` has a path, the last segment of the
   *    path is used as the database name and a `Database` instance is
   *    returned. Otherwise, a `Client` instance is returned.
   */

  sage.make = function(uri) {
    var client, index;

    uri = sage._parseURI(uri);

    if (index = /^(https?:\/\/[^\/]+).*?(\/[^\/]+)?$/.exec(uri.host)) {
      uri.host = index[1], index = index[2] && decodeURIComponent(index[2]);
    }

    client = new sage.Client(uri.host, uri);
    return index ? client.index(index) : client;
  };

  /**
   * Parse URI.
   *
   * The URI is normalized by removing extra `//` in the path and extracting
   * the authentication component, if present.
   *
   * @param {String} uri Fully qualified URI.
   * @return {String} The normalized URI.
   */

  sage._parseURI = function(uri) {
    var match;

    if (uri) {
      uri = uri.replace(/\/+/g, '\/').replace(/\/+$/g, '');
      if (match = /^(https?:\/\/)(?:([^@:]+):([^@]+)@)?([^\/]+)(.*)$/.exec(uri)) {
        return {
          host: match[1] + match[4],
          user: match[2] && decodeURIComponent(match[2]),
          pass: match[3] && decodeURIComponent(match[3])
        };
      }
    }

    return { host: uri || '' };
  };

  /**
   * Base prototype for `Client` and `Database`.
   * Encapsulates HTTP methods, JSON handling, and response coersion.
   */

  sage.Base = {

    /**
     * Service request and parse JSON response.
     *
     * @param {String} [method="'GET'"] HTTP method.
     * @param {String} [path=this.uri] HTTP URI.
     * @param {Object} [query] HTTP query options.
     * @param {Object} [body] HTTP body.
     * @param {Object} [headers] HTTP headers.
     * @param {Function} [callback] Callback function.
     *   @param {Error|null} error Error or `null` on success.
     *   @param {Object} data Response data.
     *   @param {Integer} status Response status code.
     *   @param {Object} headers Response headers.
     * @return This object for chaining.
     */

    request: function(/* [method], [path], [query], [data], [headers], [callback] */) {
      var args = [].slice.call(arguments)
        , callback = isFunction(args[args.length - 1]) && args.pop()
        , headers = args[4] || {}
        , path = args[1] ? '/' + args[1] : '';

      if (!('Content-Type' in headers)) headers['Content-Type'] = 'application/json';

      this._request(
        args[0] || 'GET',                             // method
        this.uri + path,                            // uri
        args[2],                                    // query
        args[3] && JSON.stringify(args[3],
          /^\/_mapping/.test(path) && this._replacer
        ) || '',                                    // body
        headers,                                    // headers
        this.auth || {},                            // auth
        callback
      );

      return this;
    },

    /**
     * Service request and parse JSON response. All arguments are required.
     *
     * @param {String} method HTTP method.
     * @param {String} path HTTP URI.
     * @param {Object} query HTTP query options.
     * @param {Object} body HTTP body.
     * @param {Object} headers HTTP headers.
     * @param {Function} callback Callback function.
     *   @param {Error|null} error Error or `null` on success.
     *   @param {Object} data Response data.
     *   @param {Integer} status Response status code.
     *   @param {Object} headers Response headers.
     * @api private
     */

    _request: function(method, uri, query, body, headers, auth, callback) {
      var self = this
        , xhr = new XMLHttpRequest()
        , qval = [], header, key;

      if (query) {
        for (key in query) {
          qval.push(encodeURIComponent(key) + '=' + encodeURIComponent(query[key]));
        }
        if (qval.length) uri += '?' + qval.join('&');
      }

      xhr.open(method, uri, true, auth.user, auth.pass);

      if (headers) {
        for (header in headers) {
          xhr.setRequestHeader(header, headers[header]);
        }
      }

      xhr.onreadystatechange = function() {
        if (callback && xhr.readyState === 4) {
          var headers = self._getHeaders(xhr)
            , data = xhr.responseText
            , err;

          if (method == 'HEAD') {
            data = headers;
          } else if (data) {
            try {
              data = JSON.parse(data);
            } catch (e) {
              err = e;
            }
          }

          if (!err) data = self._response(data);

          callback(err, data, xhr.status, headers, xhr);
        }
      };

      xhr.send(body);
    },

    /**
     * Coerce response to normalize access to `id` and `rev`.
     *
     * @param {Object} json The response JSON.
     * @return The coerced JSON.
     * @api private
     */

    _response: function(json) {
      // var data = json.rows || json.results || json.uuids || isArray(json) && json
      //   , meta = this._meta
      //   , i = 0, len, item;

      // if (data) {
      //   for (len = data.length; i < len; i++) {
      //     item = data[i] = meta(data[i]);
      //     if (json.rows && item.doc) item.doc = meta(item.doc);
      //   }
      //   data = [].slice.call(data);
      //   extend(data.__proto__ = [], json).json = json;
      // } else {
      //   data = meta(json);
      // }

      return json;
    },

    /**
     * JSON stringify functions. Used for encoding view documents to JSON.
     *
     * @param {String} key The key to stringify.
     * @param {Object} val The value to stringify.
     * @return {Object} The stringified function value or the value.
     * @api private
     */

    _replacer: function(key, val) {
      return isFunction(val) ? val.toString() : val;
    },

    /**
     * Coerce documents with prototypical `id`, `_id`, `rev`, and `_rev`
     * values.
     *
     * @param {Object} doc The document to coerce.
     * @return {Object} The coerced document.
     * @api private
     */

    _meta: function(doc) {
      var hasId = !doc.id ^ !doc._id
        , hasRev = !doc.rev ^ !doc._rev
        , proto;

      if (hasId || hasRev) {
        proto = extend(doc.__proto__ = {}, doc);
        if (hasId) proto._id = doc.id = doc._id || doc.id;
        if (hasRev) proto._rev = doc.rev = doc._rev || doc.rev;
      }

      return doc;
    },

    /**
     * HTTP headers to parse.
     */

    _headers: [
      'cache-control',
      'content-length',
      'content-type',
      'date',
      'etag',
      'server'
    ],

    /**
     * Parse HTTP response headers.
     */

    _getHeaders: function(xhr) {
      var headers = {}
        , header, i = 0;

      while (header = this._headers[i++]) {
        headers[header] = xhr.getResponseHeader(header);
      }

      return headers;
    },

    /**
     * Parse arguments.
     *
     * @param {Array} args The arguments.
     * @param {Integer} start The index from which to start reading arguments.
     * @param {Boolean} withDoc Set to `true` if the doc source is given as a
     *   parameter before HTTP query options.
     * @return This object for chaining.
     * @api private
     */

    _: function(args, start, withDoc) {
      var self = this, doc, id, rev;

      function request(method, path, options) {
        if (!options) options = {};

        self.request(
          method,
          path || request.p,
          'q' in options ? options.q : request.q,
          'b' in options ? options.b : request.b,
          'h' in options ? options.h : request.h,
          'f' in options ? options.f : request.f
        );

        return self;
      }

      // [id], [doc], [query], [header], [callback]
      args = [].slice.call(args, start);

      request.f = isFunction(args[args.length - 1]) && args.pop();
      request.p = isString(args[0]) && encodeURI(args.shift()) ||
                  isArray(args[0]) && encodeURI(args.shift().join(','));
      request.q = args[withDoc ? 1 : 0] || {};
      request.h = args[withDoc ? 2 : 1] || {};

      if (withDoc) {
        if (doc = (request.b = args[0])) {
          if (id = request.p || doc._id || doc.id) request.p = id;
          if (rev = request.q.rev || doc._rev || doc.rev) request.q.rev = rev;
        }
      }

      return request;
    }

  };

  /**
   * Sage ElasticSearch client.
   *
   * @param {String} uri Fully qualified URI.
   * @param {Object} [auth] Authentication options.
   *   @param {String} [auth.user] Username.
   *   @param {String} [auth.pass] Password.
   */

  sage.Client = function(uri, auth) {
    this.uri = uri;
    this.auth = auth;
    this._index = {};
  };

  sage.Client.prototype = {

    /**
     * Select index to manipulate.
     *
     * @param {String[]} name Index name.
     * @return {Database} Database object.
     */

    index: function(name) {
      var index = this._index;

      if (isString(name)) name = name.split(',');
      name.sort();
      name = name.join(',');

      return index[name] || (index[name] = new sage.Index(this, name, this.auth));
    },

    /**
     * Get cluster health.
     *
     * @return This object for chaining.
     */

    health: function(/* [nodes], [query], [headers], [callback] */) {
      return this._(arguments)('GET', '_cluster/health');
    },

    /**
     * Get cluster state.
     *
     * @return This object for chaining.
     */

    state: function(/* [nodes], [query], [headers], [callback] */) {
      var request = this._(arguments);
      return request('GET',
        '_cluster/state' + (request.p ? '/' + request.p : '')
      );
    },

    /**
     * Get nodes info.
     *
     * @param {String[]} nodes Node name or array of node names.
     * @return This object for chaining.
     */

    nodes: function(/* [nodes], [query], [headers], [callback] */) {
      var request = this._(arguments);
      return request('GET',
        '_nodes' + (request.p ? '/' + request.p : '')
      );
    },

    /**
     * Get nodes stats.
     *
     * @param {String[]} nodes Node name or array of node names.
     * @return This object for chaining.
     */

    stats: function(/* [nodes], [query], [headers], [callback] */) {
      var request = this._(arguments);
      return request('GET',
        '_nodes' + (request.p ? '/' + request.p : '') + '/stats'
      );
    },

    /**
     * Shutdown node(s).
     *
     * @param {String[]} nodes Node name or array of node names.
     * @return This object for chaining.
     */

    shutdown: function(/* [nodes], [query], [headers], [callback] */) {
      var request = this._(arguments);
      return request('POST',
        '_nodes' + (request.p ? '/' + request.p : '') + '/_shutdown'
      );
    },

    /**
     * Get or set settings.
     *
     * @param {String} [settings] Settings.
     * @return This object for chaining.
     */

    settings: function(/* [settings], [query], [headers], [callback] */) {
      var request = this._(arguments, 0, 1);
      return request(request.b ? 'PUT' : 'GET', '_cluster/settings');
    },

    /**
     * Get or set template.
     *
     * @param {String} [settings] Settings.
     * @return This object for chaining.
     */

    template: function(/* [name], [template], [query], [headers], [callback] */) {
      var request = this._(arguments, 0, 1);
      return request(request.b ? 'PUT' : 'GET', '_template/' + request.p);
    }

  };

  /**
   * Methods for ElasticSearch database.
   *
   * @param {Client} client Clerk client.
   * @param {String} name Database name.
   * @param {Object} [auth] Authentication options.
   *   @param {String} [auth.user] Username.
   *   @param {String} [auth.pass] Password.
   * @return This object for chaining.
   */

  sage.Index = function(client, name, auth) {
    this.client = client;
    this.name = name;
    this.uri = client.uri + '/' + encodeURIComponent(name);
    this.auth = auth;
  };

  sage.Index.prototype = {

    /**
     * Create index.
     *
     * @return This object for chaining.
     */

    create: function(/* [mapping], [query], [headers], [callback] */) {
      return this._(arguments, 0, 1)('PUT');
    },

    /**
     * Destroy index.
     *
     * @return This object for chaining.
     */

    destroy: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('DELETE');
    },

    /**
     * Check if index exists.
     *
     * @return This object for chaining.
     */

    exists: function(/* [query], [headers], callback */) {
      var request = this._(arguments), callback = request.f;

      request.f = function(err, body, status, headers, xhr) {
        callback(err, status === 200, status, headers, xhr);
      };

      return request('HEAD');
    },

    /**
     * Fetch document.
     *
     * @param {String} [typeAndId] type with document ID.
     * @return This object for chaining.
     */

    get: function(/* [typeAndId], [query], [headers], [callback] */) {
      return this._(arguments)('GET');
    },

    /**
     * Get document metadata.
     *
     * @param {String} id Document ID.
     * @param {Object} [query] HTTP query options.
     * @param {Function} callback Callback function.
     *   @param {Error|null} callback.error Error or `null` on success.
     *   @param {Object|Object[]} [callback.body] Document metadata or array
     *     of document metadata.
     *     @param result.id Document ID.
     *     @param result.rev Document revision.
     *     @param [result.contentType] MIME content type. Only available when
     *       getting metadata for single document.
     *     @param [result.contentLength] Content length. Only available when
     *       getting metadata for single document.
     * @return This object for chaining.
     */

    head: function(/* [id], [query], [headers], callback */) {
      var request = this._(arguments), callback = request.f
        , id = request.p
        , rev;

      request.f = function(err, body, status, headers, xhr) {
        callback(err, err ? body : {
          _id: id, id: id,
          _rev: rev = headers.etag && JSON.parse(headers.etag), rev: rev,
          contentType: headers['content-type'],
          contentLength: headers['content-length']
        }, status, headers, xhr);
      };

      return request('HEAD');
    },

    /**
     * Post document to index.
     *
     * If documents have no ID, a document ID will be automatically generated
     * on the server.
     *
     * @return This object for chaining.
     */

    post: function(doc /* [query], [headers], [callback] */) {
      return this._(arguments, 1)('POST', 0, { b: doc });
    },

    /**
     * Put document in index.
     *
     * @param {Object} doc Document data. Requires `id` and `rev`.
     * @param {String} [options] Options.
     * @return This object for chaining.
     */

    put: function(/* [doc], [query], [headers], [callback] */) {
      var request = this._(arguments, 0, 1);
      // prevent acidentally creating index
      if (!request.p) throw new Error('missing id');
      return request('PUT');
    },

    /**
     * Delete document(s).
     *
     * @param {String} doc Document or document ID.
     * @param {Object} [query] HTTP query options.
     * @return This object for chaining.
     */

    del: function(docs /* [query], [headers], [callback] */) {
      if (isArray(docs)) {
        var i = 0, len, doc;
        for (len = docs.length; i < len; i++) {
          doc = docs[i], docs[i] = {
            _id: doc._id || doc.id,
            _rev: doc._rev || doc.rev,
            _deleted: true
          };
        }
        return this.bulk.apply(this, arguments);
      } else {
        var request = this._(arguments, 0, 1);
        // prevent acidentally deleting database
        if (!request.p) throw new Error('missing id');
        return request('DELETE');
      }
    },

    /**
     * Fetch documents.
     *
     * @param {String} [typeAndId] type with document ID.
     * @param {String} [docs] Document descriptors.
     * @return This object for chaining.
     */

    all: function(/* [typeAndId], [docs], [query], [headers], [callback] */) {
      return this._(arguments, 0, 1)('GET');
    },

    /**
     * Update or delete documents in bulk.
     *
     * @param {Object[]} docs Array of documents to insert or update.
     *   @param {String} [doc._id] Document ID.
     *   @param {String} [doc._index] Index name.
     *   @param {String} [doc._type] Index type.
     *   @param {Boolean} [doc._deleted] Flag indicating whether this document
     *     should be deleted.
     * @return This object for chaining.
     */

    bulk: function(/* [type], [docs], [query], [headers], [callback] */) {
      throw new Error('not implemented');
    },

    /**
     * Close index.
     *
     * @return This object for chaining.
     */

    close: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('POST', '_close');
    },

    /**
     * Open index.
     *
     * @return This object for chaining.
     */

    open: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('POST', '_open');
    },

    /**
     * Refresh index.
     *
     * @return This object for chaining.
     */

    refresh: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('POST', '_refresh');
    },

    /**
     * Flush index data to storage index, freeing memory.
     *
     * @return This object for chaining.
     */

    flush: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('POST', '_flush');
    },

    /**
     * Clear cache.
     *
     * @return This object for chaining.
     */

    clear: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('GET', '_cache/clear');
    },

    /**
     * Optimize index.
     *
     * @return This object for chaining.
     */

    optimize: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('POST', '_optimize');
    },

    /**
     * Perform a snapshot through the index gateway.
     *
     * @return This object for chaining.
     */

    snapshot: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('POST', '_gateway/snapshot');
    },

    /**
     * Get or set settings.
     *
     * @param {String} [settings] Settings.
     * @return This object for chaining.
     */

    settings: function(/* [settings], [query], [headers], [callback] */) {
      var request = this._(arguments, 0, 1);
      return request(request.b ? 'PUT' : 'GET', '_settings');
    },

    /**
     * Get or set mapping.
     *
     * @param {String} [mapping] Mapping.
     * @return This object for chaining.
     */

    map: function(/* [mapping], [query], [headers], [callback] */) {
      var request = this._(arguments, 0, 1);
      return request(request.b ? 'PUT' : 'GET',
        (request.p ? request.p + '/' : '') + '_mapping'
      );
    },

    /**
     * Delete mapping.
     *
     * @return This object for chaining.
     */

    unmap: function(/* [query], [headers], [callback] */) {
      var request = this._(arguments);
      return request('DELETE',
        (request.p ? request.p + '/' : '') + '_mapping'
      );
    },

    /**
     * Get index stats.
     *
     * @return This object for chaining.
     */

    stats: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('GET', '_stats');
    },

    /**
     * Get index status.
     *
     * @return This object for chaining.
     */

    status: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('GET', '_status');
    },

    /**
     * Get index segments.
     *
     * @return This object for chaining.
     */

    segments: function(/* [query], [headers], [callback] */) {
      return this._(arguments)('GET', '_segments');
    }

  };

  sage.Client.prototype.__proto__ =
  sage.Index.prototype.__proto__ =
  sage.Base;

})(
  typeof module != 'undefined' && module,
  encodeURI,
  encodeURIComponent,
  decodeURIComponent
);
