if (!document.getItems) {

// trick IE into handling these elements properly
document.createElement('audio');
document.createElement('video');
document.createElement('time');

// emulate Object.defineProperty
if (!Object.defineProperty && document.__defineGetter__) {
    Object.defineProperty = function(obj, prop, desc) {
	if (desc.get)
	    obj.__defineGetter__(prop, desc.get);
	if (desc.set)
	    obj.__defineSetter__(prop, desc.set);
    };
}

// emulate Element.textContent
if (typeof document.documentElement.textContent == 'undefined') {
    Object.defineProperty(Element.prototype, 'textContent',
	{
	    get: function() {
		return this.innerText;
	    },
	    set: function(val) {
		this.innerText = val;
	    }
	});
}

// utility functions

function splitTokens(s) {
    if (s && /\S/.test(s))
	return s.replace(/^\s+|\s+$/g,'').split(/\s+/);
    return [];
}

function inList(item, list) {
    for (var i = 0; i < list.length; i++) {
	if (item == list[i])
	    return true;
    }
    return false;
}

// http://ejohn.org/blog/comparing-document-position/
function contains(a, b){
    return a.contains ?
	a != b && a.contains(b) :
	!!(a.compareDocumentPosition(b) & 16);
}

function fakeCollection(rootElem, incFilter, recFilter) {
    var elems = [];
    elems.item = function(idx){return this[idx];};

    function update(_incFilter, _recFilter) {
	elems.length = 0;
	function pushElements(elem) {
	    if (_incFilter(elem))
		elems.push(elem);
	    if (!_recFilter || _recFilter(elem)) {
		for (var child = elem.firstChild; child; child = child.nextSibling) {
		    if (child.nodeType == 1) {
			pushElements(child);
		    }
		}
	    }
	}
	pushElements(rootElem);
    }

    function updateSimple() {
	update(incFilter, recFilter);
    }

    function afterUpdate() {
	if (typeof elems.__onchange__ == 'function') {
	    elems.__onchange__();
	}
    }

    function updateHandler() {
	updateSimple();
	afterUpdate();
    }

    // keep collection up to date if possible
    if (rootElem.addEventListener) {
	rootElem.addEventListener('DOMAttrModified', updateHandler, false);
	rootElem.addEventListener('DOMNodeInserted', updateHandler, false);
	rootElem.addEventListener('DOMNodeRemoved',
	    function(ev) {
		update(function(e){return e != ev.target && incFilter(e);},
		       function(e){return e != ev.target;});
		afterUpdate();
	    }, false);
    }

    updateSimple();

    return elems;
}

function map(list, func) {
    var ret = [];
    for (var i = 0; i < list.length; i++) {
	ret.push(func(list[i]));
    }
    return ret;
}

function filter(list, pred) {
    var ret = [];
    for (var i = 0; i < list.length; i++) {
	if (pred(list[i]))
	    ret.push(list[i]);
    }
    return ret;
}

// Element attribute<->property reflection

function reflectBoolean(attr, prop) {
    Object.defineProperty(Element.prototype, prop,
	{ get: function () { return this.hasAttribute(attr); },
	  set: function (val) { if (val) this.setAttribute(attr, attr);
				else this.removeAttribute(attr); } });
}

function reflectString(attr, prop) {
    Object.defineProperty(Element.prototype, prop,
	{ get: function () { return this.getAttribute(attr) || ""; },
	  set: function (val) { this.setAttribute(attr, val); }});
}

function reflectSettableTokenList(attr, prop) {
    function getProp() {
	var elem = this;
	var list = [];
	list.item = function(index) { return this[index]; };

	function update() {
	    list.length = 0;
	    if (elem.hasAttribute(attr))
		list.push.apply(list, splitTokens(elem.getAttribute(attr)));
	}
	update();

	function getValue() { return elem.hasAttribute(attr) ? elem.getAttribute(attr) : ''; };
	function setValue(val) { elem.setAttribute(attr, val); };
	Object.defineProperty(list, 'value', { get: getValue, set: setValue });

	list.toString = getValue;

	function validate(token) {
	    if (!token)
		throw new Error('SYNTAX_ERR');
	    if (/\s/.test(token))
		throw new Error('INVALID_CHARACTER_ERR');
	}

	list.contains = function(token) {
	    validate(token);
	    return inList(token, this);
	};
	if (elem.addEventListener)
	    elem.addEventListener('DOMAttrModified', update, false);
	list.add = function(token) {
	    validate(token);
	    if (!inList(token, this)) {
		var attrValue = elem.hasAttribute(attr) ? elem.getAttribute(attr) : '';
		if (attrValue.length && attrValue[attrValue.length-1] != ' ')
		    attrValue += ' ';
		attrValue += token;
		elem.setAttribute(attr, attrValue);
	    }
	};
	list.remove = function(token) {
	    validate(token);
	    var input = elem.hasAttribute(attr) ? elem.getAttribute(attr) : '';
	    var output = '';
	    while (input) {
		var m = /^(\s+)?(\S+)(\s+)?/.exec(input);
		if (m) {
		    input = input.substr(m[0].length);
		    if (m[2] == token) {
			output = output.replace(/\s+$/, '');
			if (input && output)
			    output += ' ';
		    } else {
			output += m[0];
		    }
		} else {
		    output += input;
		    break;
		}
	    }
	    elem.setAttribute(attr, output);
	};
	list.toggle = function(token) {
	    validate(token);
	    if (this.contains(token)) {
		this.remove(token);
		return false;
	    } else {
		this.add(token);
		return true;
	    }
	};
	return list;
    }
    function setProp(val) {
	this.setAttribute(attr, val);
    }
    Object.defineProperty(Element.prototype, prop,
	{ get: getProp, set: setProp });
}

reflectBoolean('itemscope', 'itemScope');
// FIXME: should be URL?
reflectString('itemtype', 'itemType');
// FIXME: should be URL?
reflectString('itemid', 'itemId');
reflectSettableTokenList('itemprop', 'itemProp');
// FIXME: should also be DOMSettableTokenList?
reflectString('itemref', 'itemRef');
// FIXME: only if not browser-implemented
reflectString('datetime', 'dateTime');

function getItemValueProperty(e) {
    var tag = e.tagName.toUpperCase();
    if (tag == 'META')
	return 'content';
    if (tag == 'AUDIO' || tag == 'EMBED' ||
	tag == 'IFRAME' || tag == 'IMG' ||
	tag == 'SOURCE' || tag == 'VIDEO')
	return 'src';
    if (tag == 'A' || tag == 'AREA' || tag == 'LINK')
	return 'href';
    if (tag == 'OBJECT')
	return 'data';
    if (tag == 'TIME' && e.hasAttribute('datetime'))
	return 'dateTime';
    return 'textContent';
}

Object.defineProperty(Element.prototype, 'itemValue',
{
    get: function() {
	if (!this.hasAttribute('itemprop'))
	    return null;
	if (this.hasAttribute('itemscope'))
	    return this;
	return this[getItemValueProperty(this)];
    },
    set: function(val) {
	if (!this.hasAttribute('itemprop') || this.hasAttribute('itemscope'))
	    throw new Error('INVALID_ACCESS_ERR');
	this[getItemValueProperty(this)] = val;
    }
});

// Element.properties

// http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2009-November/024212.html
function getCorrespondingItem(node) {
    var current = node;
    while (current) {
	if (current.id) {
	    var referrer = document.querySelector('*[itemref~='+current.id+']');
	    if (referrer && referrer != node)
		return referrer;
	}
	current = current.parentNode;
	if (current && current.itemScope)
	    return current;
    }
    return null;
}

Object.defineProperty(Element.prototype, 'properties', { get:
function() {
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#the-properties-of-an-item
    var itemElem = this;

    var props = [];
    function updateProperties(elemFilter) {
	props.length = 0;
	var docProps = document.querySelectorAll('*[itemprop]');
	for (var i = 0; i < docProps.length; i++) {
	    if (elemFilter(docProps[i]) && getCorrespondingItem(docProps[i]) == itemElem)
		props.push(docProps[i]);
	}
    }

    props.names = [];
    function updateNames() {
	props.names.length = 0;
	for (var i = 0; i < props.length; i++) {
	    for (var j=0; j<props[i].itemProp.length; j++) {
		if (!inList(props[i].itemProp[j], props.names))
		    props.names.push(props[i].itemProp[j]);
	    }
	}
    }

    function updatePropertyNodeList(pnl, name) {
	pnl.length = 0;
	pnl.values.length = 0;
	for (var i=0; i<props.length; i++) {
	    if (inList(name, props[i].itemProp)) {
		pnl.push(props[i]);
		pnl.values.push(props[i].itemValue);
	    }
	}
    }

    props.item = function(idx){return this[idx];};

    var pnlCache = {};
    props.namedItem = function (name) {
	if (!pnlCache[name]) {
	    // fake PropertyNodeList
	    var pnl = [];
	    pnl.item = function(idx){return this[idx];};
	    pnl.values = [];
	    updatePropertyNodeList(pnl, name);
	    pnlCache[name] = pnl;
	}
	return pnlCache[name];
    };

    function updateHandler(elemFilter) {
	updateProperties(function(e){return typeof elemFilter != 'function' || elemFilter(e);});
	updateNames();
	for (name in pnlCache)
	    updatePropertyNodeList(pnlCache[name], name);
    }

    // keep collection up to date if possible
    if (document.documentElement.addEventListener) {
	document.documentElement.addEventListener('DOMAttrModified', updateHandler, false);
	document.documentElement.addEventListener('DOMNodeInserted', updateHandler, false);
	document.documentElement.addEventListener('DOMNodeRemoved',
	    function(ev) {
		updateHandler(function(e){return (e != ev.target) && !contains(ev.target, e);});
	    }, false);
    }

    updateHandler();
    return props;
}});

// document.getItems

document.getItems = function(typeNames) {
    var types = splitTokens(typeNames);

    function isTopLevelItem(e) {
	return e.hasAttribute('itemscope') &&
	    !e.hasAttribute('itemprop') &&
	    (types.length == 0 ||
	     inList(e.getAttribute('itemtype'), types));
    }

    return fakeCollection(this.documentElement, isTopLevelItem);
};
    
}
