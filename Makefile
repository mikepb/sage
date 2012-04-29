REPORTER=dot

# prefer installed scripts
export PATH := $(CURDIR)/node_modules/.bin:/usr/local/bin:${PATH}

OUTJS = sage.js
MINJS = sage.min.js

build: $(MINJS)

test: $(MINJS)
	@PATH=$(PATH) mocha --reporter $(REPORTER) --require 'test/shared' --bail

$(MINJS): $(OUTJS)
	uglifyjs $(OUTJS) > $(MINJS)

.PHONY: build test
