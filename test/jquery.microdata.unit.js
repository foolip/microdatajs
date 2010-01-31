/* -*- mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil -*- */

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
  t(document, undefined, ['w', 'x', 'loops', 'ioItem']);
  t('#x', undefined, []);
  t('#io', undefined, ['ioItem']);
  t(document, 'http://n.whatwg.org/work', ['w', 'x']);
  t(document, 'bogus', []);
});

test('jQuery.fn.properties', function() {
  function t(selector, expected) {
    same($(selector).properties().toArray(),
         $.map(expected, function(id) { return document.getElementById(id); }),
         selector);
  }
  t('#testdata', []);
  t('#w', ['w0', 'w1', 'w2', 'w3']);
  t('#x', []);
  t('#loops', []);
  t('#loop0', []);
  t('#loop1', []);
  t('#loop2', []);
  t('#loop3', []);
  t('#loop4', []);
  t('#ioItem', []);
});

function testStringReflection($elm, attr, func, attrString, funcString) {
  // attrString is the content attribute value, while funcString is
  // the expected value when getting the property (if given)
  if (typeof funcString == 'undefined')
    funcString = attrString;

  if (typeof $elm == 'string')
    $elm = $(document.createElement($elm));

  // attr -> getter
  equals($elm[func](), '', 'get empty string');
  $elm.attr(attr, attrString);
  equals($elm[func](), funcString, 'get reflected string');
  $elm.removeAttr(attr);
  equals($elm[func](), '', 'get empty string');

  // setter -> attr
  ok(!$elm.attr(attr), 'no attr');
  //equal($elm.attr(attr), undefined, 'no attr');
  $elm[func](attrString);
  equals($elm.attr(attr), attrString, 'reflected attr');
  $elm[func]('');
  equals($elm.attr(attr), '', 'empty attr');
}

test('jQuery.fn.itemScope', function() {
  var $elm = $(document.createElement('div'));
  // attr -> getter
  equals($elm.itemScope(), false);
  $elm.attr('itemscope', '');
  equals($elm.itemScope(), true);
  $elm.get(0).removeAttribute('itemscope');
  equals($elm.itemScope(), false);
  // setter -> attr
  equals($elm.attr('itemscope'), undefined);
  $elm.itemScope(true);
  equals($elm.attr('itemscope'), 'itemscope');
  $elm.itemScope(false);
  equals($elm.attr('itemscope'), undefined);
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
  t('<meta itemprop="do do">', ['do']);
  t('<meta itemprop="do re do">', ['do', 're']);
});

test('jQuery.fn.itemRef', function() {
  function t(html, expected) {
    same($(html).itemRef().toArray(), expected);
  }
  t('<meta>', []);
  t('<meta itemref="do">', ['do']);
  t('<meta itemref="do re">', ['do', 're']);
  t('<meta itemref="re do">', ['re', 'do']);
  t('<meta itemref="do do">', ['do']);
  t('<meta itemref="do re do">', ['do', 're']);
});

module('jQuery.fn.itemValue');

test('no @itemprop', function() {
  var $elm = $(document.createElement('div'));
  equals($elm.itemValue(), null);
  $elm.itemValue('foo');
  equals($elm.itemValue(), null);
});

test('@itemscope', function() {
  var $elm = $('<div itemprop itemscope></div>');
  equals($elm.itemValue(), $elm.get(0));
  $elm.itemValue('foo');
  equals($elm.itemValue(), $elm.get(0));
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
  // read-only for now
  equals($('<time></time>').itemValue(), undefined);
  equals($('<time itemprop>now</time>').itemValue(), 'now');
  equals($('<time itemprop datetime="1984-09-03">then</time>').itemValue(), '1984-09-03');
/*
  // text -> getter
  $elm.text('now');
  equals($elm.itemValue(), 'now');
  // setter -> text
  $elm.itemValue('later');
  equals($elm.text(), 'later');
  // attr -> getter
  $elm.attr('datetime', '2010-01-24');
  equals($elm.itemValue(), '2010-01-24');
  // setter -> attr
  $elm.itemValue('1984-09-03');
  equals($elm.attr('datetime'), '1984-09-03');
*/
});
