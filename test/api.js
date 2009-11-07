window.onload = function() {

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

test(".itemProp reflects @itemprop", function() {
  testStringReflection('span', 'itemprop', 'itemProp', 'Semantic Thing');
});

test(".itemRef reflects @itemref", function() {
  testStringReflection('span', 'itemref', 'itemRef', 'id1 id2');
});

test(".itemValue without @itemprop", function() {
  var elm = document.createElement('div');
  ok(elm.itemValue === null, ".itemValue is null");
  var code = null;
  try { elm.itemValue = ''; } catch (e) { code = e.code; }
  equals(code, 15, 'setting .itemValue throws INVALID_ACCESS_ERR');
});

test(".itemValue with @itemprop and @itemscope", function() {
  var elm = document.createElement('div');
  elm.setAttribute('itemprop', 'foo');
  elm.setAttribute('itemscope', '');
  equals(elm.itemValue, elm, ".itemValue is the element itself");
  var code = null;
  try { elm.itemValue = ''; } catch (e) { code = e.code; }
  equals(code, 15, 'setting .itemValue throws INVALID_ACCESS_ERR');
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

test("time .itemValue reflects @datetime (when present)", function() {
  ok(false);
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

function verifyProperties(actual, expected, message) {
  equals(actual.length, expected.length, message+'.length');
  for (var i=0; i < actual.length && i < expected.length; i++) {
    equals(actual.item(i), expected[i], message+'.item('+i+')');
    //equals(actual(i), expected[i], message+'('+i+')');
    //equals(actual[i], expected[i], message+'['+i+']');
    // build names list
  }
}

test("HTMLElement.properties", function() {
  var parent = document.getElementById("parent");
  var item = document.createElement('div');
  parent.appendChild(item);

  var props = item.properties;
  equals(typeof props, 'object', '.properties is an object');
  //ok(props instanceof HTMLPropertiesCollection, '.properties instanceof HTMLPropertiesCollection');
  equals(typeof props.length, 'number', '.properties.length is a number');
  equals(typeof props.names, 'object', '.properties.names is an object');
  //ok(props instanceof DOMStringList, '.properties.names instanceof DOMStringList');
  equals(typeof props.item, 'function', '.properties.item is a function');
  equals(typeof props.namedItem, 'function', '.properties.namedItem is a function');

  // non-item matches nothing
  verifyProperties(props, [], "props");

  // item without any properties
  item.setAttribute('itemscope', '');
  verifyProperties(props, [], "props");

  var prop1 = document.createElement('div');
  prop1.setAttribute('itemprop', 'prop1');
  item.appendChild(prop1);
  verifyProperties(props, [prop1], "props");
});

}
