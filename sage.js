/*
(c) Michael Phan-Ba
github.com/mikepb/sage
Apache License
*/

;(function(
  encodeURI,
  encodeURIComponent,
  decodeURIComponent
){

  var global = this;

  /**
   * Copy properties from sources to target.
   *
   * @param {Object} target The target object.
   * @param {Object...} sources The source object.
   * @return {Object} The target object.
   * @api private
   */

  var extend = function(target /* sources.. */) {
    var source, key, i = 1;
    while (source = arguments[i++]) {
      for (key in source) target[key] = source[key];
    }
    return target;
  };

  /**
   * Stringify value.
   *
   * @param {Object} that That value to stringify.
   * @return {String} The stringifyed value.
   * @api private
   */

  var asString = function(that) {
    return Object.prototype.toString.call(that);
  };

  /**
   * Check if value is an object.
   *
   * @param {Object} that That value to check.
   * @return {Boolean} `true` if object, `false` otherwise.
   * @api private
   */

  var isObject = function(that) {
    return asString(that) == '[object Object]';
  };

  /**
   * Check if value is an array.
   *
   * @param {Object} that That value to check.
   * @return {Boolean} `true` if array, `false` otherwise.
   * @api private
   */

  var isArray = function(that) {
    return asString(that) == '[object Array]';
  };

  /**
   * Check if value is a function.
   *
   * @param {Object} that That value to check.
   * @return {Boolean} `true` if function, `false` otherwise.
   * @api private
   */

  var isFunction = function(that) {
    return asString(that) == '[object Function]';
  };

  /**
   * Sage library entry point.
   *
   * @param {String} servers ElasticSearch server URI.
   * @return {Client|Index} If a URI path is given, returns a `Index`,
   *   otherwise returns a `Client`.
   */

  var sage = function(uri) {
    return sage.make(uri);
  };

  /**
   * Restore global variable `sage` to original value.
   *
   * @return {sage} The `sage` library as an object.
   */

  var previousSage = this.sage; this.sage = sage;
  sage.noConflict = function() {
    global.sage = previousSage;
    return sage;
  };

  /**
   * Library version.
   */

  sage.version = '0.4.2';

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

    if (uri.path && (index = /\/*([^\/]+)\/*$/.exec(uri.path))) {
      uri.path = uri.path.substr(0, index.index);
      index = index[1] && decodeURIComponent(index[1]);
    }

    client = new sage.Client(uri.host + uri.path, uri);
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
      if (match = /^(https?:\/\/)(?:([^@:]+):([^@]+)@)?([^\/]+)(.*)\/*$/.exec(uri)) {
        return {
          host: match[1] + match[4].replace(/\/+/g, '\/'),
          path: match[5],
          user: match[2] && decodeURIComponent(match[2]),
          pass: match[3] && decodeURIComponent(match[3])
        };
      }
    }

    return { host: uri || '', path: '' };
  };

  /**
   * Base prototype for `Client` and `Database`.
   * Encapsulates HTTP methods, JSON handling, and response coersion.
   */

  sage.Base = function(){};

  sage.Base.prototype = {

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
        , path = args[1] ? '/' + args[1] : ''
        , data = args[3] || '';

      if (data && !/\/_bulk$/.test(path)) {
        data = JSON.stringify(args[3],
          /^\/_mapping/.test(path) && this._replacer
        );
      }

      if (!('Content-Type' in headers)) headers['Content-Type'] = 'application/json';

      this._request(
        args[0] || 'GET',                          // method
        this.uri + path,                            // uri
        args[2],                                    // query
        data,                                       // body
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
        uri += '?' + qval.join('&');
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
            if (!err) {
              if (data.error) err = new Error(data.error);
              else data = self._response(data);
            }
          }

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
      var data = json.items || json.hits && json.hits.hits
        , meta = this._meta
        , i = 0, len;

      if (data) {
        data = [].slice.call(data);
        extend(data.__proto__ = [], json, json.hits).json = json;
        for (len = data.length; i < len; i++) data[i] = meta(data[i]);
      } else {
        data = meta(json);
      }

      return data;
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
        , hasRev = !doc.version ^ !doc._version
        , proto;

      if (hasId || hasRev) {
        proto = extend(doc.__proto__ = {}, doc);
        if (hasId) proto._id = doc.id = doc._id || doc.id;
        if (hasRev) proto._version = doc.version = doc._version || doc.version;
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
          path || request.p || '',
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
      request.p = args[0] && (
                    isArray(args[0]) && encodeURI(args.shift().join(',')) ||
                    !isObject(args[0]) && !isFunction(args[0]) && encodeURI(args.shift())
                  ) || '';
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
    this._indexes = {};
  };

  sage.Client.prototype = {

    /**
     * Select index to manipulate.
     *
     * @param {String[]} name Index name.
     * @return {Index} Index object.
     */

    index: function(name) {
      var indexes = this._indexes;

      if (name && name.split) name = name.split(',');
      name.sort();
      name = name.join(',');

      return indexes[name] || (indexes[name] = new sage.Index(this, name, this.auth));
    },

    /**
     * Configure or get ElasticSearch river info.
     *
     * @param {String} name River name.
     * @param {Object} [meta] River configuration.
     * @return {Index} Index object.
     */

    river: function(name /* [meta], [query], [headers], [callback] */) {
      var request = this._(arguments, 1, 1);
      return request(request.b ? 'PUT' : 'GET', '_river/' + name + '/_meta');
    },

    /**
     * Remove river.
     *
     * @param {String} name River name.
     * @return {Index} Index object.
     */

    unriver: function(name /* [query], [headers], [callback] */) {
      return this._(arguments, 1)('DELETE', '_river/' + name);
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
      return request('GET', '_cluster/state/' + (request.p || ''));
    },

    /**
     * Get nodes info.
     *
     * @param {String[]} nodes Node name or array of node names.
     * @return This object for chaining.
     */

    nodes: function(/* [nodes], [query], [headers], [callback] */) {
      var request = this._(arguments);
      return request('GET', '_nodes/' + (request.p || ''));
    },

    /**
     * Get or update cluster settings.
     *
     * @return This object for chaining.
     */

    config: function(/* [settings], [query], [headers], [callback] */) {
      var request = this._(arguments, 0, 1);
      return request(request.b ? 'PUT' : 'GET', '_cluster/settings');
    },

    /**
     * Get or update template.
     *
     * @param {Object} [template] Template.
     * @return This object for chaining.
     */

    tmpl: function(/* [name], [template], [query], [headers], [callback] */) {
      var request = this._(arguments, 0, 1);
      return request(request.b ? 'PUT' : 'GET', '_template/' + request.p);
    },

    /**
     * Delete template.
     *
     * @param {String} [template] Template.
     * @return This object for chaining.
     */

    untmpl: function(/* [name], [query], [headers], [callback] */) {
      var request = this._(arguments);
      return request('DELETE', '_template/' + request.p);
    }

  };

  /**
   * Methods for ElasticSearch index.
   *
   * @param {Client} client Sage client.
   * @param {String} name Index name.
   * @param {Object} [auth] Authentication options.
   *   @param {String} [auth.user] Username.
   *   @param {String} [auth.pass] Password.
   */

  sage.Index = function(client, name, auth) {
    this.client = client;
    this.name = name;
    this.uri = client.uri + (name ? '/' + encodeURIComponent(name) : '');
    this.auth = auth;
    this._types = {};
  };

  sage.Index.prototype = {

    /**
     * Select type to manipulate.
     *
     * @param {String[]} name Type name.
     * @return {Index} Index object.
     */

    type: function(name) {
      var types = this._types;
      return types[name] || (types[name] = new sage.Type(this, name, this.auth));
    },

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
     * Get or put mapping.
     *
     * @param {String} [type] Type for which to get or put mapping. Required
     *                        for put mapping.
     * @param {Object} [mapping] The mapping object to put for the given type.
     * @return This object for chaining.
     */

    map: function(/* [type], [mapping], [query], [headers], [callback] */) {
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

  /**
   * Methods for ElasticSearch type.
   *
   * @param {Index} index Sage index.
   * @param {String} name Type name.
   * @param {Object} [auth] Authentication options.
   *   @param {String} [auth.user] Username.
   *   @param {String} [auth.pass] Password.
   * @return new Type
   */

  sage.Type = function(index, type, auth) {
    this.index = index;
    this.name = type;
    this.uri = index.uri + (type ? '/' + encodeURIComponent(type) : '');
    this.auth = auth;
  };

  sage.Type.prototype = {

    /**
     * Fetch documents.
     *
     * @param {String} [docs] Document descriptors.
     * @return This object for chaining.
     */

    all: function(/* [docs], [query], [headers], [callback] */) {
      return this._(arguments, 0, 1)('GET', '_mget');
    },

    /**
     * Search index.
     *
     * @param search Search body.
     * @return This object for chaining.
     */

    find: function(/* [search], [query], [headers], [callback] */) {
      return this._(arguments, 0, 1)('POST', '_search');
    },

    /**
     * Fetch document.
     *
     * @param {String} [id] document ID.
     * @return This object for chaining.
     */

    get: function(/* [id], [query], [headers], [callback] */) {
      return this._(arguments)('GET');
    },

    /**
     * Post document to index.
     *
     * If documents have no ID, a document ID will be automatically generated
     * on the server.
     *
     * Multiple documents can be posted to different indexes using the
     * `_index`, `_type`, and `_id`, `_deleted`, and other elasticsearch
     * fields beginning with `_`.
     *
     * @param {String} type Document type.
     * @param {Object[]} docs Document or array of documents.
     * @return This object for chaining.
     */

    post: function(docs /* [query], [headers], [callback] */) {
      var request = this._(arguments, 1)
        , doc, meta, data, action
        , buf = '', i, len, key;

      if (isArray(docs)) {
        request.p = '_bulk';
        for (i = 0, len = docs.length; i < len; i++) {
          doc = docs[i], meta = {}, data = {};
          action = meta[doc._deleted ? 'delete' : 'index'] = {};

          for (key in doc) {
            (key[0] == '_' ? action : data)[key] = doc[key];
          }

          buf += JSON.stringify(meta) + '\n' +
                 JSON.stringify(doc) + '\n';
        }
      }

      return request('POST', 0, { b: buf || docs });
    },

    /**
     * Put document in index.
     *
     * @param {Object} doc Document data. Requires `id` and `rev`.
     * @param {String} [options] Options.
     * @return This object for chaining.
     */

    put: function(doc /* [query], [headers], [callback] */) {
      // prevent accidentally creating index
      if (!this.name || !doc._id && !doc.id) throw new Error('missing type or id');
      return this._(arguments, 1)('PUT', doc._id || doc.id, { b: doc });
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
        var i = 0, len, doc, data = {};
        for (len = docs.length; i < len; i++) {
          doc = docs[i], data[i] = {
            _index: doc._index || doc.index,
            _type: doc._type || doc.type,
            _id: doc._id || doc.id,
            _version: doc._version || doc.version,
            _deleted: true
          };
        }
        docs = data;
        return this.post.apply(this, arguments);
      } else {
        // prevent accidentally deleting index
        if (!this.name || !docs._id && !docs.id) throw new Error('missing type or id');
        return this._(arguments, 1)('DELETE', docs._id || docs.id);
      }
    },

    /**
     * Update document.
     *
     * @param {String} id document ID
     * @param {String} doc
     * @param {Object} [query]
     * @param {Object} [headers]
     * @param {Object} [callback]
     * @return this
     */

    up: function(id, doc /* [query], [headers], [callback] */) {
      // prevent accidentally creating index
      if (!this.name || !id) throw new Error('missing type or id');
      return this._(arguments, 2)('POST', id + '/_update', { b: doc });
    },

    /**
     * More-like-this query.
     *
     * @param {String} id document ID
     * @param {Object} [query]
     * @param {Object} [headers]
     * @param {Object} [callback]
     * @return this
     */
    mlt: function(id /* [query], [headers], [callback] */) {
      var request = this._(arguments, 1)
        , fields = request.q && request.q.mlt_fields;
      if (isArray(fields)) request.q.mlt_fields = fields.join(',');
      return request('GET', id + '/_mlt');
    }

  };

  sage.Client.prototype = extend(new sage.Base(), sage.Client.prototype);
  sage.Index.prototype  = extend(new sage.Base(), sage.Index.prototype, sage.Type.prototype);
  sage.Type.prototype   = extend(new sage.Base(), sage.Type.prototype);

})(
  encodeURI,
  encodeURIComponent,
  decodeURIComponent
);
