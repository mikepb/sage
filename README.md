# sage [![Build Status](https://secure.travis-ci.org/mikepb/sage.png)](http://travis-ci.org/mikepb/sage)

ElasticSearch for Node.JS and sister project to [clerk][clerk]

```javascript
var sage = require('sage');
var client = sage('http://127.0.0.1:9200');

client.index('search').type('email').post({
  title: 'Hello World!',
  content: 'She sold sea shells on the sea shore.'
}, function(err){

  client.index('search').find({
    query: { query_string: { query: 'shells' } }
  }, function(err, data){
    console.dir(data);
  });

});
```

## Documentation

[Sage Documentation][sage]

## Installation

```bash
$ npm install sage
```

## Experimental Browser Support

`sage.js` and `sage.min.js` are the browser and minified browser versions of
the library. Modern browsers are generally supported, but not widely tested.
The `test/index.html` and `test/index-min.html` run the [mocha][mocha] tests
in the browser.

Security restrictions on cross-domain requests currently limits the usefulness
of the browser version. Using a local proxy or configuring [Cross-Origin
Resource Sharing][cors] on a proxy in front of ElasticSearch may allow you to
use the library in the browser.

## Philosophy

The philosophy of *sage* is to provide a thin wrapper around the ElasticSearch
API, making the search engine easier to use from JavaScript. *sage* is
designed to quickly allow you to get started with ElasticSearch. As you get
more comfortable with *sage* and Elasticsearch, *sage* gives you full access
to ElasticSearch's more advanced features.

The library API generally follows the RESTful API, so you can use the
ElasticSearch docs as well as the *sage* docs to build your applications. If a
feature is missing from *sage* or you need to access more advanced features,
the `request` method allows you to send custom requests directly to
ElasticSearch.

## License

Copyright 2012 Michael Phan-Ba

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[clerk]: https://github.com/mikepb/clerk
[cors]: http://www.w3.org/TR/cors/
[mocha]: http://visionmedia.github.com/mocha/
[sage]: http://mikepb.github.com/sage
