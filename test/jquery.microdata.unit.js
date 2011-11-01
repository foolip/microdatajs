/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

'use strict';

test('jQuery.fn.items', function() {
  function t(context, types, expected) {
    var msg = '$(';
    msg += context == document ? 'document' : ("'"+context+"'");
    msg += ').items(';
    if (types)
      msg += "'"+types+"'";
    msg += ')';
    deepEqual($(context).items(types).toArray(),
              $.map(expected, function(id) { return document.getElementById(id); }),
              msg);
  }
  t(document, undefined, ['w', 'x', 'dupref', 'loops', 'ioItem', 'dupprops', 'noprops']);
  t('#x', undefined, []);
  t('#io', undefined, ['ioItem']);
  t(document, 'http://n.whatwg.org/work', ['w', 'x']);
  t(document, 'http://n.foolip.org/work http://n.whatwg.org/work', ['x']);
  t(document, 'bogus', []);
});

test('jQuery.fn.properties', function() {
  function t(selector, name, expected) {
    deepEqual($(selector).properties(name).toArray(),
              $.map(expected, function(id) { return document.getElementById(id); }),
              selector);
  }
  t('#testdata', undefined, []);
  t('#w', undefined, ['w0', 'w1', 'w2', 'w3']);
  t('#w', 'title', ['w1']);
  t('#w', 'noexist', []);
  t('#x', undefined, ['w2', 'w3', 'x0', 'x1']);
  t('#x', 'work', ['x0']);
  t('#x', 'author', ['w2']);
  t('#dupref', undefined, ['w1']);
  t('#loops', undefined, ['loop0','loop1', 'loop2', 'loop3']);
  t('#loop0', undefined, []);
  t('#loop1', undefined, ['loop2']);
  t('#loop2', undefined, ['loop3']);
  t('#loop3', undefined, ['loop2']);
  t('#ioItem', undefined, ['ioBefore', 'ioChild', 'ioAfter']);
  t('#dupprops', undefined, ['foo0', 'bar0', 'bar1', 'foo1']);
  t('#dupprops', 'foo', ['foo0', 'foo1']);
  t('#dupprops', 'bar', ['bar0', 'bar1']);
  t('#noprops', undefined, []);
});

function testTokenListReflection(elm, attr, func) {
  var $elm = $(document.createElement(elm));

  function t(tokens) {
    var attrVal = tokens.join(' \t\n\f\r');
    $elm.attr(attr, attrVal);
    var list = $elm[func]();
    deepEqual($(list).toArray(), tokens);
    $.each(tokens, function(i, token) {
      ok(list.contains(token));
    });
  }

  t([]);
  t(['a']);
  t(['a', 'b']);
  t(['b', 'a']);
  t(['a', 'a']);
  t(['a', 'b', 'a']);
  t(['com.example.Thing', 'http://example.com/Thing']);
}

function testStringReflection($elm, attr, func, attrString, funcString) {
  // attrString is the content attribute value, while funcString is
  // the expected value when getting the property (if given)
  if (typeof funcString == 'undefined')
    funcString = attrString;

  if (typeof $elm == 'string')
    $elm = $(document.createElement($elm));

  equal($elm[func](), '', 'get empty string');
  $elm.attr(attr, attrString);
  equal($elm[func](), funcString, 'get reflected string');
  $elm.removeAttr(attr);
  equal($elm[func](), '', 'get empty string');
}

test('jQuery.fn.itemScope', function() {
  var $elm = $(document.createElement('div'));
  equal($elm.itemScope(), false);
  $elm.attr('itemscope', '');
  equal($elm.itemScope(), true);
  $elm[0].removeAttribute('itemscope');
  equal($elm.itemScope(), false);
});

test('jQuery.fn.itemType', function() {
  testTokenListReflection('div', 'itemtype', 'itemType');
});

test('jQuery.fn.itemId', function() {
  testStringReflection('div', 'itemid', 'itemId', '#id', window.location.href+'#id');
  testStringReflection('div', 'itemid', 'itemId', 'http://example.com/id');
  testStringReflection('div', 'itemid', 'itemId', 'urn:isbn:0-330-34032-8');
});

test('jQuery.fn.itemProp', function() {
  testTokenListReflection('div', 'itemprop', 'itemProp');
});

test('jQuery.fn.itemRef', function() {
  testTokenListReflection('div', 'itemref', 'itemRef');
});

module('jQuery.fn.itemValue');

test('no @itemprop', function() {
  equal($('<div></div>').itemValue(), null);
});

test('@itemscope', function() {
  var $elm = $('<div itemprop itemscope></div>');
  equal($elm.itemValue(), $elm[0], '@itemscope');
});

test('meta', function() {
  testStringReflection($('<meta itemprop>'), 'content', 'itemValue', 'foo');
});

test('audio', function() {
  testStringReflection($('<audio itemprop></audio>'), 'src', 'itemValue', '#foo', window.location.href+'#foo');
});

test('embed', function() {
  testStringReflection($('<embed itemprop>'), 'src', 'itemValue', '#foo', window.location.href+'#foo');
});

test('iframe', function() {
  testStringReflection($('<iframe itemprop></iframe>'), 'src', 'itemValue', '#foo', window.location.href+'#foo');
});

test('img', function() {
  testStringReflection($('<img itemprop>'), 'src', 'itemValue', '#foo', window.location.href+'#foo');
});

test('source', function() {
  testStringReflection($('<source itemprop>'), 'src', 'itemValue', '#foo', window.location.href+'#foo');
});

test('track', function() {
  testStringReflection($('<track itemprop>'), 'src', 'itemValue', '#foo', window.location.href+'#foo');
});

test('video', function() {
  testStringReflection($('<video itemprop></video>'), 'src', 'itemValue', '#foo', window.location.href+'#foo');
});

test('a', function() {
  testStringReflection($('<a itemprop></a>'), 'href', 'itemValue', '#foo', window.location.href+'#foo');
});

test('area', function() {
  testStringReflection($('<area itemprop>'), 'href', 'itemValue', '#foo', window.location.href+'#foo');
});

test('link', function() {
  testStringReflection($('<link itemprop>'), 'href', 'itemValue', '#foo', window.location.href+'#foo');
});

test('object', function() {
  testStringReflection($('<object itemprop></object>'), 'data', 'itemValue', '#foo', window.location.href+'#foo');
});

test('data', function() {
  testStringReflection($('<data itemprop></data>'), 'value', 'itemValue', 'foo');
});

module('jQuery.microdata.json');

test('JSON extraction', function() {
  var json = $.microdata.json();
  deepEqual(JSON.parse(json), { items: [
    {
      type: ['http://n.whatwg.org/work'],
      properties: {
        work: ['http://foolip.org/microdatajs/'],
        title: ['MicrodataJS'],
        author: ['Philip Jägenstedt'],
        license: ['http://creativecommons.org/licenses/by/3.0/']
      }
    },
    {
      type: ['http://n.whatwg.org/work', 'http://n.foolip.org/work'],
      properties: {
        author: ['Philip Jägenstedt'],
        license: ['http://creativecommons.org/licenses/by/3.0/'],
        work: ['http://blog.foolip.org/'],
        title: ['Pretentious Nonsense']
      }
    },
    {
      properties: {
        title: ['MicrodataJS']
      }
    },
    {
      properties: {
        self: [ { properties: {} } ],
        head: [ { properties: { first: [ { properties: { last: [ { properties: { first: ['ERROR'] } } ] } } ] } } ],
        first: [ { properties: { last: [ { properties: { first: ['ERROR'] } } ] } } ],
        last: [ { properties: { first: [ { properties: { last: ['ERROR'] } } ] } } ]
      }
    },
    {
      properties: {
        oddstuff: ['via parent', 'via tree', 'via parent']
      }
    },
    {
      properties: {
        foo: ['', ''],
        bar: ['', '']
      }
    },
    {
      properties: {}
    }
  ]});
});
