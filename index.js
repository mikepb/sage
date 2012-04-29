/*!

    Sage ElasticSearch for node and the browser.
    Copyright 2012 Michael Phan-Ba

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

/**
 * Module dependencies.
 */

var request = require('request');

/**
 * Sage library.
 */

require('./sage');
var sage = module.exports = global.sage.noConflict();

/**
 * Patchable prototypes.
 */

var Base = sage.Base;

/**
 * Remove irrelevant methods.
 */

delete sage.noConflict;
delete Base._headers;
delete Base._getHeaders;

// auth uris are automatically handled
Base._parseURI = function(uri) {
  if (uri) uri = uri.replace(/\/+/g, '\/').replace(/\/+$/g, '');
  return { host: uri || 'http://127.0.0.1:9200' };
};

// request-based requests
Base._request = function(method, uri, query, body, headers, auth, callback) {
  var self = this, status;
  request({
    method: method,
    uri: uri,
    qs: query,
    headers: headers,
    body: body || '',
    json: true
  }, function(err, res, data) {
    if (callback) {
      if (method === 'HEAD') data = res.headers;
      if (!err && data) data = self._response(data);
      if (res) status = res.statusCode, headers = res.headers;
      callback(err, data, status, headers, res);
    }
  });
};
