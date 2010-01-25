/* -*- mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil -*- */

function testBoolReflection(tag, attr, prop) {
  var elm = document.createElement(tag);

  equals(typeof elm[prop], 'boolean', 'typeof .'+prop);

  // reflect content attribute -> DOM property
  equals(elm[prop], false, 'no @'+attr);
  elm.setAttribute(attr, '');
  equals(elm[prop], true, '@'+attr+'=""');
  elm.setAttribute(attr, attr);
  equals(elm[prop], true, '@'+attr+'="'+attr+'"');
  elm.removeAttribute(attr);
  equals(elm[prop], false, 'removing @'+attr);

  // reflect DOM property -> content attribute
  elm[prop] = true;
  ok(elm.hasAttribute(attr), '.'+prop+'=true');
  elm[prop] = false;
  ok(!elm.hasAttribute(attr), '.'+prop+'=false');
}

function testStringReflection(elm, attr, prop, attrString, propString) {
  // attrString is the content attribute value, while propString is
  // the expected value when getting the property (if given)
  if (typeof propString == 'undefined')
    propString = attrString;

  if (typeof elm == 'string')
    elm = document.createElement(elm);

  equals(typeof elm[prop], 'string', 'typeof .'+prop);

  // reflect content attribute -> DOM property
  equals(elm[prop], '', 'no @'+attr);
  elm.setAttribute(attr, attrString);
  equals(elm[prop], propString, 'setting @'+attr);
  elm.removeAttribute(attr);
  equals(elm[prop], '', 'removing @'+attr);

  // reflect DOM property -> content attribute
  elm[prop] = '';
  equals(elm.getAttribute(attr), '', 'setting .'+prop+'=""');
  elm[prop] = attrString;
  equals(elm.getAttribute(attr), attrString, 'setting .'+prop+'="'+attrString+'"');
  //delete elm[prop];
  //ok(!elm.hasAttribute(attr), 'deleting .'+prop);
}

function testURLReflection(elm, attr, prop, url) {
  // like string reflection except getting resolves URLs
  var resolved;
  if (url.indexOf(':') == -1)
      resolved = window.location.href + url;
  else
      resolved = url;

  testStringReflection(elm, attr, prop, url, resolved);
}

function testDOMSettableTokenListReflection(tag, attr, prop) {
  var elm = document.createElement(tag);
  var list = elm[prop];

  // content attribute -> DOMSettableTokenList
  function verifyTokenList(value, allItems, notContainItems) {
    equals(list.value, value, 'token list .value'+value);
    equals(list.length, allItems.length, 'token list length');
    for (var i=0; i < list.length && i < allItems.length; i++) {
      equals(list.item(i), allItems[i], 'token list .item() getter');
      equals(list[i], allItems[i], 'token list [] getter');
      ok(list.contains(allItems[i]), 'token list contains '+allItems[i]);
    }
    for (i=0; i<notContainItems.length; i++) {
      ok(!list.contains(notContainItems[i]), 'token list does not contain '+notContainItems[i]);
    }
    var stringified = ''+list;
    equals(stringified, value, 'token list stringifies to underlying value');
  }
  verifyTokenList('', [], ['a', 'b']);
  elm.setAttribute(attr, ' ');
  verifyTokenList(' ', [], ['a', 'b']);
  elm.setAttribute(attr, ' a');
  verifyTokenList(' a', ['a'], ['b']);
  elm.setAttribute(attr, 'a  b ');
  verifyTokenList('a  b ', ['a', 'b'], []);
  elm.setAttribute(attr, 'a  b b');
  verifyTokenList('a  b b', ['a', 'b', 'b'], []);
  elm.removeAttribute(attr);
  verifyTokenList('', [], ['a', 'b']);

  // DOMSettableTokenList.add()
  function testAdd(before, token, after) {
      list.value = before;
      list.add(token);
      equals(list.value, after, '"'+before+'" add("'+token+'") -> "'+after+'"');
  }
  testAdd('', 'a', 'a');
  testAdd('a', 'a', 'a');
  testAdd(' a', 'a', ' a');
  testAdd('a ', 'a', 'a ');
  testAdd(' a ', 'a', ' a ');
  testAdd('a', 'b', 'a b');
  testAdd(' a', 'b', ' a b');
  testAdd('  a', 'b', '  a b');
  testAdd('a ', 'b', 'a b');
  testAdd('a  ', 'b', 'a  b');
  testAdd(' a ', 'b', ' a b');
  testAdd('  a  ', 'b', '  a  b');
  testAdd('a a', 'b', 'a a b');
  testAdd(' a a', 'b', ' a a b');
  testAdd('a a ', 'b', 'a a b');
  testAdd(' a a ', 'b', ' a a b');
  testAdd('a  a', 'b', 'a  a b');
  testAdd('  a  a', 'b', '  a  a b');
  testAdd('a  a  ', 'b', 'a  a  b');
  testAdd('  a  a  ', 'b', '  a  a  b');

  // DOMSettableTokenList.remove()
  function testRemove(before, token, after) {
      list.value = before;
      list.remove(token);
      equals(list.value, after, '"'+before+'" remove("'+token+'") -> "'+after+'"');
  }
  testRemove('a', 'a', '');
  testRemove('a ', 'a', '');
  testRemove(' a', 'a', '');
  testRemove(' a ', 'a', '');
  testRemove('a a ', 'a', '');
  testRemove(' a a ', 'a', '');
  testRemove('a a  ', 'a', '');
  testRemove(' a a  ', 'a', '');
  testRemove('a b', 'a', 'b');
  testRemove(' a b ', 'a', 'b ');
  testRemove('b a', 'a', 'b');
  testRemove(' b a', 'a', ' b');
  testRemove('a b a', 'a', 'b');
  testRemove(' a b a ', 'a', 'b');
  testRemove('a b a', 'b', 'a a');
  testRemove(' a b a ', 'b', ' a a ');
  testRemove('a b  b a', 'a', 'b  b');
  testRemove(' a b  b a ', 'a', 'b  b');
  testRemove('a b  b a', 'b', 'a a');
  testRemove(' a b  b a ', 'b', ' a a ');
  testRemove('a b a b', 'a', 'b b');
  testRemove(' a b a b ', 'a', 'b b ');
  testRemove('a b a b', 'b', 'a a');
  testRemove(' a b a b ', 'b', ' a a');

  // DOMSettableTokenList.toggle
  function testToggle(before, token, after, retval) {
      list.value = before;
      var ret = list.toggle(token);
      equals(list.value, after, '"'+before+'" toggle("'+token+'") -> "'+after+'"');
      equals(ret, retval);
  }
  testToggle('', 'a', 'a', true);
  testToggle('a', 'a', '', false);
}

function testDOMSettableTokenListExceptions(tag, prop) {
  var throwMethods = ['contains', 'add', 'remove', 'toggle'];
  for (var i=0; i<throwMethods.length; i++) {
    var elm = document.createElement(tag);
    // access with empty token throws SYNTAX_ERR
    try {
      elm[prop][throwMethods[i]]('');
    } catch (e) {
      equals(e.code, 12, throwMethods[i]);
    }
    // access with whitespace token throws INVALID_CHARACTER_ERR
    try {
      elm[prop][throwMethods[i]](' ');
    } catch (e) {
      equals(e.code, 5, throwMethods[i]);
    }
  }
  expect(2*throwMethods.length);
}

function testItemValueReflection(tag, attr, str) {
  var elm = document.createElement(tag);
  elm.setAttribute('itemprop', '');
  testStringReflection(elm, attr, 'itemValue', str);
}

module("HTMLElement.itemScope");

test(".itemScope reflects @itemscope", function() {
  testBoolReflection('span', 'itemscope', 'itemScope');
});

module("HTMLElement.itemType");

test(".itemType reflects @itemtype", function() {
  testStringReflection('span', 'itemtype', 'itemType', 'http://example.com/vocab#thing');
  testStringReflection('span', 'itemtype', 'itemType', '#thing');
});

module("HTMLElement.itemId");

test(".itemId reflects @itemid", function() {
  testURLReflection('span', 'itemid', 'itemId', 'http://example.com/item');
  testURLReflection('span', 'itemid', 'itemId', 'item');
});

module("HTMLElement.itemProp");

test(".itemProp reflects @itemprop (DOMSettableTokenList)",
function() {
  testDOMSettableTokenListReflection('span', 'itemprop', 'itemProp');
});

test(".itemProp exceptions (DOMSettableTokenList)", function() {
  testDOMSettableTokenListExceptions('span', 'itemProp');
});

module("HTMLElement.itemRef");

test(".itemRef reflects @itemref", function() {
  testDOMSettableTokenListReflection('span', 'itemref', 'itemRef');
});

test(".itemRef exceptions (DOMSettableTokenList)", function() {
  testDOMSettableTokenListExceptions('span', 'itemRef');
});

module("HTMLElement.itemValue");

test(".itemValue without @itemprop", function() {
  var elm = document.createElement('div');
  ok(elm.itemValue === null, ".itemValue is null");
  try {
      elm.itemValue = '';
  } catch (e) {
      equals(e.code, 15, 'setting .itemValue throws INVALID_ACCESS_ERR');
  }
  expect(2);
});

test(".itemValue with @itemprop and @itemscope", function() {
  var elm = document.createElement('div');
  elm.setAttribute('itemprop', 'foo');
  elm.setAttribute('itemscope', '');
  equals(elm.itemValue, elm, ".itemValue is the element itself");
  try {
      elm.itemValue = '';
  } catch (e) {
      equals(e.code, 15, 'setting .itemValue throws INVALID_ACCESS_ERR');
  }
  expect(2);
});

test("meta .itemValue reflects @content", function() {
  testItemValueReflection('meta', 'content', 'Semantic Thing');
});

test("audio .itemValue reflects @src", function() {
  testItemValueReflection('audio', 'src', 'http://example.com/');
});

test("embed .itemValue reflects @src", function() {
  testItemValueReflection('embed', 'src', 'http://example.com/');
});

test("iframe .itemValue reflects @src", function() {
  testItemValueReflection('iframe', 'src', 'http://example.com/');
});

test("img .itemValue reflects @src", function() {
  testItemValueReflection('img', 'src', 'http://example.com/');
});

test("source .itemValue reflects @src", function() {
  testItemValueReflection('source', 'src', 'http://example.com/');
});

test("video .itemValue reflects @src", function() {
  testItemValueReflection('video', 'src', 'http://example.com/');
});

test("a .itemValue reflects @href", function() {
  testItemValueReflection('a', 'href', 'http://example.com/');
});

test("area .itemValue reflects @href", function() {
  testItemValueReflection('area', 'href', 'http://example.com/');
});

test("link .itemValue reflects @href", function() {
  testItemValueReflection('link', 'href', 'http://example.com/');
});

test("object .itemValue reflects @data", function() {
  testItemValueReflection('object', 'data', 'http://example.com/');
});

test("time .itemValue reflection depends on @datetime", function() {
  var elm = document.createElement('time');
  elm.itemProp = 'testDate';
  elm.itemValue = 'January 1970';
  equals(elm.textContent, 'January 1970', '.itemValue -> textContent');
  elm.textContent = 'September 1984';
  equals(elm.itemValue, 'September 1984', 'textContent -> .itemValue');
  elm.setAttribute('datetime', '1970-01-01');
  equals(elm.itemValue, '1970-01-01', '@datetime -> .itemValue');
  elm.itemValue = '1984-09-03';
  equals(elm.getAttribute('datetime'), '1984-09-03', '.itemValue -> @datetime');
});

test("div .itemValue acts as .textContent", function() {
  var elm = document.createElement('div');
  elm.setAttribute('itemprop', '');
  equals(elm.itemValue, '', 'no child nodes');
  elm.appendChild(document.createTextNode('Semantic Thing'));
  equals(elm.itemValue, 'Semantic Thing', 'text node');
  var b = document.createElement('b');
  b.appendChild(document.createTextNode(' 2'));
  elm.appendChild(b);
  equals(elm.itemValue, 'Semantic Thing 2', 'text node + element node');
  elm.itemValue = 'Thing Semantic';
  equals(elm.childNodes.length, 1, 'setting .itemValue');
  equals(elm.firstChild.nodeValue, 'Thing Semantic', 'setting .itemValue');
});

function verifyItems(actual, expected, message) {
  equals(actual.length, expected.length, message+'.length');
  for (var i=0; i < actual.length && i < expected.length; i++) {
    equals(actual.item(i), expected[i], message+'.item('+i+')');
    //equals(actual(i), expected[i], message+'('+i+')');
    equals(actual[i], expected[i], message+'['+i+']');
  }
}

module("HTMLDocument.getItems");

test("document.getItems()", function() {
  var items = document.getItems();

  //ok(items instanceof NodeList, "returns NodeList");
  verifyItems(items, [], "items");

  // add an item
  var parent = document.getElementById("parent");
  var item = document.createElement('div');
  item.setAttribute('itemscope', '');
  parent.appendChild(item);
  verifyItems(items, [item], "items");

  // element with @itemprop is not top-level item
  item.setAttribute('itemprop', '');
  verifyItems(items, [], "items");

  // removing @itemprop makes if top-level again
  item.removeAttribute('itemprop');
  verifyItems(items, [item], "items");

  // @itemtype is ignored
  item.setAttribute('itemtype', 'http://example.com/#type');
  verifyItems(items, [item], "items");

  // nested top-level items work
  var item2 = document.createElement('div');
  item2.setAttribute('itemscope', '');
  item.appendChild(item2);
  verifyItems(items, [item, item2], "items");

  // sibling top-level items
  parent.appendChild(item2);
  verifyItems(items, [item, item2], "items");

  // cleanup
  parent.innerHTML = "";
  verifyItems(items, [], "items");
});

test("document.getItems(types)", function() {
  var catType = "http://example.org/animals#cat";
  var dogType = "http://example.org/animals#dog";

  var cats = document.getItems(catType);
  var dogs = document.getItems(dogType);
  var catsAndDogs = document.getItems(catType+' '+dogType);
  var all = document.getItems(' ');
  verifyItems(cats, [], "cats");
  verifyItems(dogs, [], "dogs");
  verifyItems(catsAndDogs, [], "catsAndDogs");
  verifyItems(all, [], "all");

  // item without type is not matched
  var parent = document.getElementById("parent");
  var item = document.createElement("div");
  item.setAttribute('itemscope', '');
  parent.appendChild(item);
  verifyItems(cats, [], "cats");
  verifyItems(dogs, [], "dogs");
  verifyItems(catsAndDogs, [], "catsAndDogs");
  verifyItems(all, [item], "all");

  // adding cat item
  var catItem = document.createElement('div');
  catItem.setAttribute('itemscope', '');
  catItem.setAttribute('itemtype', catType);
  parent.appendChild(catItem);
  verifyItems(cats, [catItem], "cats");
  verifyItems(dogs, [], "dogs");
  verifyItems(catsAndDogs, [catItem], "catsAndDogs");
  verifyItems(all, [item, catItem], "all");

  // adding dog item
  var dogItem = document.createElement('div');
  dogItem.setAttribute('itemscope', '');
  dogItem.setAttribute('itemtype', dogType);
  parent.appendChild(dogItem);
  verifyItems(cats, [catItem], "cats");
  verifyItems(dogs, [dogItem], "dogs");
  verifyItems(catsAndDogs, [catItem, dogItem], "catsAndDogs");
  verifyItems(all, [item, catItem, dogItem], "all");

  // removing cat item
  parent.removeChild(catItem);
  verifyItems(cats, [], "cats");
  verifyItems(dogs, [dogItem], "dogs");
  verifyItems(catsAndDogs, [dogItem], "catsAndDogs");
  verifyItems(all, [item, dogItem], "all");

  // whitespace in itemtype is respected
  dogItem.setAttribute('itemtype', dogType + ' ');
  verifyItems(cats, [], "cats");
  verifyItems(dogs, [], "dogs");
  verifyItems(catsAndDogs, [], "catsAndDogs");
  verifyItems(all, [item, dogItem], "all");

  // case of itemtype is respected
  dogItem.setAttribute('itemtype', dogType.toUpperCase());
  verifyItems(cats, [], "cats");
  verifyItems(dogs, [], "dogs");
  verifyItems(catsAndDogs, [], "catsAndDogs");
  verifyItems(all, [item, dogItem], "all");

  parent.innerHTML = '';
});

function verifyValues(actual, expected, message) {
  equals(actual.length, expected.length, message+'.length');
  for (var i=0; i < actual.length && i < expected.length; i++) {
    equals(actual[i], expected[i], message+'['+i+']');
  }
}

function verifyNames(actual, expected, message) {
  verifyValues(actual, expected, message);
}

function verifyNamedItems(actual, props, values, message) {
  verifyItems(actual, props, message);
  verifyValues(actual.values, values, message+'.values');
}

module("HTMLElement.properties");

(
function() {
  var parent, item, props, names, propsA, propsB, propsX;
  var prop1, prop2, prop3, prop4, subProps;

  test("setup", function(){
    parent = document.getElementById("parent");
    item = document.createElement('div');
    parent.appendChild(item);
    props = item.properties;
    ok(props, "item.properties");
    names = props.names;
    ok(names, "item.properties.names");
    propsA = props.namedItem('propA');
    ok(propsA, "item.properties.namedItem('propA')");
    propsB = props.namedItem('propB');
    ok(propsB, "item.properties.namedItem('propB')");
    propsX = props.namedItem('propX');
    ok(propsX, "item.properties.namedItem('propX')");
  });

  test("HTMLPropertiesCollection types", function() {
    equals(typeof props, 'object', '.properties is an object');
    //ok(props instanceof HTMLPropertiesCollection, '.properties instanceof HTMLPropertiesCollection');
    equals(typeof props.length, 'number', '.properties.length is a number');
    equals(typeof props.names, 'object', '.properties.names is an object');
    //ok(props instanceof DOMStringList, '.properties.names instanceof DOMStringList');
    equals(typeof props.item, 'function', '.properties.item is a function');
    equals(typeof props.namedItem, 'function', '.properties.namedItem is a function');
  });

  // <div></div>

  test("non-item matches nothing", function() {
    verifyItems(props, [], "props");
    verifyNames(names, [], "names");
    verifyNamedItems(propsA, [], [], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });

  // <div itemscope></div>

  test("item without any properties", function() {
    item.itemScope = true;

    verifyItems(props, [], "props");
    verifyNames(names, [], "names");
    verifyNamedItems(propsA, [], [], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });

  // <div itemscope>
  //   <div itemprop="propA">foo</div>
  // </div>

  test("child element adds property", function() {
    prop1 = document.createElement('div');
    prop1.textContent = 'foo';
    prop1.itemProp = 'propA';
    item.appendChild(prop1);

    verifyItems(props, [prop1], "props");
    verifyNames(names, ['propA'], "names");
    verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });

  // <div itemscope>
  //   <div itemprop="propA">foo</div>
  // </div>
  // <div itemprop="propB">bar</div>

  test("sibling element does not add property",
  function() {
    prop2 = document.createElement('div');
    prop2.textContent = 'bar';
    prop2.itemProp = 'propB';
    parent.appendChild(prop2);

    verifyItems(props, [prop1], "props");
    verifyNames(names, ['propA'], "names");
    verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });

  // <div itemscope itemref="id2">
  //   <div itemprop="propA">foo</div>
  // </div>
  // <div id="id2" itemprop="propB">bar</div>

  test("include sibling via itemref",
  function() {
    prop2.id = 'id2';
    item.itemRef = 'id2';

    verifyItems(props, [prop1, prop2], "props");
    verifyNames(names, ['propA', 'propB'], "names");
    verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
    verifyNamedItems(propsB, [prop2], ['bar'], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });

  // <div itemscope itemref="id2 id2">
  //   <div itemprop="propA">foo</div>
  // </div>
  // <div id="id2" itemprop="propB">bar</div>

  test("redundant itemref is ignored", function() {
    item.itemRef += ' id2';

    verifyItems(props, [prop1, prop2], "props");
    verifyNames(names, ['propA', 'propB'], "names");
    verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
    verifyNamedItems(propsB, [prop2], ['bar'], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });

  // <div itemscope itemref="id2 id2 id3">
  //   <div itemprop="propA">foo</div>
  // </div>
  // <div id="id2" itemprop="propB">
  //   bar
  //   <div id="id3" itemprop="propC">baz</div>
  // </div>

  test("child element adds property in of itemref'd element adds property", function() {
    prop3 = document.createElement('div');
    prop3.textContent = 'baz';
    prop3.id ='id3';
    prop3.itemProp = 'propC';
    prop2.appendChild(prop3);
    item.itemRef += ' id3';

    verifyItems(props, [prop1, prop2, prop3], "props");
    verifyNames(names, ['propA', 'propB', 'propC'], "names");
    verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
    verifyNamedItems(propsB, [prop2], ['barbaz'], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });

  // <div itemscope itemref="id2 id2 id3">
  //   <div itemprop="propA" itemscope>
  //     foo
  //     <div id="id4" itemprop="propB">spam</div>
  //   </div>
  // </div>
  // <div itemprop="propB" id="id2">
  //   bar
  //   <div id="id3" itemprop="propC">baz</div>
  // </div>

  test("property is made into sub-item", function() {
    prop1.itemScope = true;
    subProps = prop1.properties;
    prop4 = document.createElement('div');
    prop4.textContent = 'spam';
    prop4.id = 'id4';
    prop4.itemProp = 'propB';
    prop1.appendChild(prop4);

    verifyItems(props, [prop1, prop2, prop3], "props");
    verifyNames(names, ['propA', 'propB', 'propC'], "names");
    verifyNamedItems(propsA, [prop1], [prop1], "propsA");
    verifyNamedItems(propsB, [prop2], ['barbaz'], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
    verifyItems(subProps, [prop4], ['spam'], "subProps");
  });

  // <div itemscope itemref="id2 id2 id3 id4">
  //   <div itemprop="propA" itemscope>
  //     foo
  //     <div id="id4" itemprop="propB">spam</div>
  //   </div>
  // </div>
  // <div itemprop="propB" id="id2">
  //   bar
  //   <div id="id3" itemprop="propC">baz</div>
  // </div>

  test("sub-item's property is stolen with itemref",
  function() {
    item.itemRef += ' id4';

    verifyItems(props, [prop1, prop4, prop2, prop3], "props");
    verifyNames(names, ['propA', 'propB', 'propC'], "names");
    verifyNamedItems(propsA, [prop1], [prop1], "propsA");
    verifyNamedItems(propsB, [prop4, prop2], ['spam', 'barbaz'], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
    verifyItems(subProps, [], [], "subProps");
  });

  // <div itemscope itemref="id2 id2 id3 id4">
  //   <div itemprop="propA" itemscope>
  //     foo
  //     <div id="id4" itemprop="propB">spam</div>
  //   </div>
  // </div>

  test("removing sibling element",
  function() {
    parent.removeChild(prop2);

    verifyItems(props, [prop1, prop4], "props");
    verifyNames(names, ['propA', 'propB'], "names");
    verifyNamedItems(propsA, [prop1], [prop1], "propsA");
    verifyNamedItems(propsB, [prop4], ['spam'], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
    verifyItems(subProps, [], [], "subProps");
  });

  // <div itemscope itemref="">
  //   <div itemprop="propA" itemscope>
  //     foo
  //     <div id="id4" itemprop="propB">spam</div>
  //   </div>
  // </div>

  test("removing itemref",
  function() {
    item.itemRef = '';

    verifyItems(props, [prop1], "props");
    verifyNames(names, ['propA'], "names");
    verifyNamedItems(propsA, [prop1], [prop1], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
    verifyItems(subProps, [prop4], ['spam'], "subProps");
  });

  // <div itemscope itemref="">
  //   <div itemprop="propA" itemscope></div>
  // </div>

  test("removing child elements",
  function() {
    prop1.innerHTML = '';

    verifyItems(props, [prop1], "props");
    verifyNames(names, ['propA'], "names");
    verifyNamedItems(propsA, [prop1], [prop1], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
    verifyItems(subProps, [], [], "subProps");
  });

  // <div itemscope itemref="">
  //   <div id="id1" itemprop="propA" itemscope itemref="id1"></div>
  // </div>

  test("self-reference is ignored",
  function() {
    prop1.itemRef = prop1.id = "id1";

    verifyItems(props, [prop1], "props");
    verifyNames(names, ['propA'], "names");
    verifyNamedItems(propsA, [prop1], [prop1], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
    verifyItems(subProps, [], [], "subProps");
  });

  test("teardown", function() {
    parent.innerHTML = '';
    verifyItems(props, [], "props");
    verifyNames(names, [], "names");
    verifyNamedItems(propsA, [], [], "propsA");
    verifyNamedItems(propsB, [], [], "propsB");
    verifyNamedItems(propsX, [], [], "propsX");
  });
})();
