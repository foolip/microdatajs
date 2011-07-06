/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

test('jQuery.fn.items', function() {
  function t(context, types, expected) {
    var msg = '$(';
    msg += context == document ? 'document' : ("'"+context+"'");
    msg += ').items(';
    if (types)
      msg += "'"+types+"'";
    msg += ')';
    same($(context).items(types).toArray(),
         $.map(expected, function(id) { return document.getElementById(id); }),
         msg);
  }
  t(document, undefined, ['w', 'x', 'dupref', 'loops', 'ioItem', 'dupprops']);
  t('#x', undefined, []);
  t('#io', undefined, ['ioItem']);
  t(document, 'http://n.whatwg.org/work', ['w', 'x']);
  t(document, 'bogus', []);
});

test('jQuery.fn.properties', function() {
  function t(selector, name, expected) {
    same($(selector).properties(name).toArray(),
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
  t('#loops', undefined, ['plain', 'loop0','loop1', 'loop2', 'loop3', 'loop4']);
  t('#loop0', undefined, []);
  t('#loop1', undefined, ['loop2']);
  t('#loop2', undefined, ['loop3']);
  t('#loop3', undefined, ['loop4']);
  t('#loop4', undefined, ['loop2']);
  t('#ioItem', undefined, ['ioBefore', 'ioChild', 'ioAfter']);
  t('#dupprops', undefined, ['foo0', 'bar0', 'bar1', 'foo1']);
  t('#dupprops', 'foo', ['foo0', 'foo1']);
  t('#dupprops', 'bar', ['bar0', 'bar1']);
});

function testStringReflection($elm, attr, func, attrString, funcString) {
  // attrString is the content attribute value, while funcString is
  // the expected value when getting the property (if given)
  if (typeof funcString == 'undefined')
    funcString = attrString;

  if (typeof $elm == 'string')
    $elm = $(document.createElement($elm));

  equals($elm[func](), '', 'get empty string');
  $elm.attr(attr, attrString);
  equals($elm[func](), funcString, 'get reflected string');
  $elm.removeAttr(attr);
  equals($elm[func](), '', 'get empty string');
}

test('jQuery.fn.itemScope', function() {
  var $elm = $(document.createElement('div'));
  equals($elm.itemScope(), false);
  $elm.attr('itemscope', '');
  equals($elm.itemScope(), true);
  $elm[0].removeAttribute('itemscope');
  equals($elm.itemScope(), false);
});

test('jQuery.fn.itemType', function() {
  testStringReflection('div', 'itemtype', 'itemType', '#type');
});

test('jQuery.fn.itemId', function() {
  testStringReflection('div', 'itemid', 'itemId', '#id', window.location.href+'#id');
  testStringReflection('div', 'itemid', 'itemId', 'http://example.com/id');
  testStringReflection('div', 'itemid', 'itemId', 'urn:isbn:0-330-34032-8');
});

test('jQuery.fn.itemProp', function() {
  function t(html, expected) {
    same($(html).itemProp().toArray(), expected);
  }
  t('<meta>', []);
  t('<meta itemprop="do">', ['do']);
  t('<meta itemprop="do re">', ['do', 're']);
  t('<meta itemprop="re do">', ['re', 'do']);
  t('<meta itemprop="do do">', ['do', 'do']);
  t('<meta itemprop="do re do">', ['do', 're', 'do']);
});

test('jQuery.fn.itemRef', function() {
  function t(html, expected) {
    same($(html).itemRef().toArray(), expected);
  }
  t('<meta>', []);
  t('<meta itemref="do">', ['do']);
  t('<meta itemref="do re">', ['do', 're']);
  t('<meta itemref="re do">', ['re', 'do']);
  t('<meta itemref="do do">', ['do', 'do']);
  t('<meta itemref="do re do">', ['do', 're', 'do']);
});

module('jQuery.fn.itemValue');

test('no @itemprop', function() {
  equals($('<div></div>').itemValue(), null);
});

test('@itemscope', function() {
  var $elm = $('<div itemprop itemscope></div>');
  equals($elm.itemValue(), $elm[0], '@itemscope');
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

test('time', function() {
  equals($('<time></time>').itemValue(), undefined);
  equals($('<time itemprop>now</time>').itemValue(), 'now');
  equals($('<time itemprop datetime="1984-09-03">then</time>').itemValue(), '1984-09-03');
});
