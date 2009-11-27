module("DOM API");

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

function testStringReflection(elm, attr, prop, str) {
  if (typeof elm == 'string')
    elm = document.createElement(elm);

  equals(typeof elm[prop], 'string', 'typeof .'+prop);

  // reflect content attribute -> DOM property
  equals(elm[prop], '', 'no @'+attr);
  elm.setAttribute(attr, str);
  equals(elm[prop], str, 'setting @'+attr);
  elm.removeAttribute(attr);
  equals(elm[prop], '', 'removing @'+attr);

  // reflect DOM property -> content attribute
  elm[prop] = '';
  equals(elm.getAttribute(attr), '', 'setting .'+prop+'=""');
  elm[prop] = str;
  equals(elm.getAttribute(attr), str, 'setting .'+prop+'="'+str+'"');
  //delete elm[prop];
  //ok(!elm.hasAttribute(attr), 'deleting .'+prop);
}

function testItemValueReflection(tag, attr, str) {
  var elm = document.createElement(tag);
  elm.setAttribute('itemprop', '');
  testStringReflection(elm, attr, 'itemValue', str);
}

test(".itemScope reflects @itemscope", function() {
  testBoolReflection('span', 'itemscope', 'itemScope');
});

test(".itemType reflects @itemtype", function() {
  testStringReflection('span', 'itemtype', 'itemType', 'http://example.com/vocab#thing');
});

test(".itemId reflects @itemid", function() {
  testStringReflection('span', 'itemid', 'itemId', 'http://example.com/item');
});

function verifyTokenList(list, value, allItems, notContainItems) {
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
}

test(".itemProp reflects @itemprop (DOMSettableTokenList)", 
function() {
  // content attribute -> DOMSettableTokenList
  var elm = document.createElement('div');
  var list = elm.itemProp;
  verifyTokenList(list, '', [], ['a', 'b']);

  elm.setAttribute('itemprop', ' ');
  verifyTokenList(list, ' ', [], ['a', 'b']);

  elm.setAttribute('itemprop', ' a');
  verifyTokenList(list, ' a', ['a'], ['b']);

  elm.setAttribute('itemprop', 'a  b ');
  verifyTokenList(list, 'a  b ', ['a', 'b'], []);

  elm.setAttribute('itemprop', 'a  b b');
  verifyTokenList(list, 'a  b b', ['a', 'b', 'b'], []);

  elm.removeAttribute('itemprop');
  verifyTokenList(list, '', [], ['a', 'b']);

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
  testRemove('a b  b a', 'a', 'b  b');

  // DOMSettableTokenList.toggle
  function testToggle(before, token, after, retval) {
      list.value = before;
      var ret = list.toggle(token);
      equals(list.value, after, '"'+before+'" toggle("'+token+'") -> "'+after+'"');
      equals(ret, retval);
  }
  testToggle('', 'a', 'a', true);
  testToggle('a', 'a', '', false);
});

test(".itemRef reflects @itemref", function() {
  testStringReflection('span', 'itemref', 'itemRef', 'id1 id2');
});

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

test("HTMLElement.properties", function() {
  var parent = document.getElementById("parent");
  var item = document.createElement('div');
  parent.appendChild(item);

  var props = item.properties;
  var names = props.names;
  var propsA = props.namedItem('propA');
  var propsB = props.namedItem('propB');
  var propsX = props.namedItem('propX');

  equals(typeof props, 'object', '.properties is an object');
  //ok(props instanceof HTMLPropertiesCollection, '.properties instanceof HTMLPropertiesCollection');
  equals(typeof props.length, 'number', '.properties.length is a number');
  equals(typeof props.names, 'object', '.properties.names is an object');
  //ok(props instanceof DOMStringList, '.properties.names instanceof DOMStringList');
  equals(typeof props.item, 'function', '.properties.item is a function');
  equals(typeof props.namedItem, 'function', '.properties.namedItem is a function');

  // non-item matches nothing
  verifyItems(props, [], "props");
  verifyNames(names, [], "names");
  verifyNamedItems(propsA, [], [], "propsA");
  verifyNamedItems(propsB, [], [], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");

  // item without any properties
  item.itemScope = true;
  verifyItems(props, [], "props");
  verifyNames(names, [], "names");
  verifyNamedItems(propsA, [], [], "propsA");
  verifyNamedItems(propsB, [], [], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");

  var prop1 = document.createElement('div');
  prop1.textContent = 'foo';
  prop1.itemProp = 'propA';
  item.appendChild(prop1);
  verifyItems(props, [prop1], "props");
  verifyNames(names, ['propA'], "names");
  verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
  verifyNamedItems(propsB, [], [], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");

  // prop2 not descendent of item
  var prop2 = document.createElement('div');
  prop2.textContent = 'bar';
  prop2.itemProp = 'propB';
  parent.appendChild(prop2);
  verifyItems(props, [prop1], "props");
  verifyNames(names, ['propA'], "names");
  verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
  verifyNamedItems(propsB, [], [], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");

  // include prop2 via itemref
  prop2.id = 'id2';
  item.itemRef = 'id2';
  verifyItems(props, [prop1, prop2], "props");
  verifyNames(names, ['propA', 'propB'], "names");
  verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
  verifyNamedItems(propsB, [prop2], ['bar'], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");

  // redundant itemref
  item.itemRef += ' id2';
  verifyItems(props, [prop1, prop2], "props");
  verifyNames(names, ['propA', 'propB'], "names");
  verifyNamedItems(propsA, [prop1], ['foo'], "propsA");
  verifyNamedItems(propsB, [prop2], ['bar'], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");

  // nested property in itemref'd tree
  var prop3 = document.createElement('div');
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

  // children of itemscope'd candidate element not included even if
  // itemref'd
  var prop4 = document.createElement('div');
  prop4.id = 'id4';
  prop4.itemProp = 'propA';
  prop4.itemScope = true;
  item.appendChild(prop4);
  var prop5 = document.createElement('div');
  prop5.id = 'id5';
  prop5.itemProp = 'propB';
  prop4.appendChild(prop5);
  item.itemRef += ' id5';
  verifyItems(props, [prop1, prop4, prop2, prop3], "props");
  verifyNames(names, ['propA', 'propB', 'propC'], "names");
  verifyNamedItems(propsA, [prop1, prop4], ['foo', prop4], "propsA");
  verifyNamedItems(propsB, [prop2], ['barbaz'], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");

  // destroy
  parent.innerHTML = '';
  verifyItems(props, [], "props");
  verifyNames(names, [], "names");
  verifyNamedItems(propsA, [], [], "propsA");
  verifyNamedItems(propsB, [], [], "propsB");
  verifyNamedItems(propsX, [], [], "propsX");
});
