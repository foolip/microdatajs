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
    if (s && /\S/.test(s)) return s.split(/\s+/);
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
	while (elems.length)
	    elems.pop();
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

reflectBoolean('itemscope', 'itemScope');
reflectString('itemtype', 'itemType');
reflectString('itemid', 'itemId');
reflectString('itemprop', 'itemProp');
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

Object.defineProperty(Element.prototype, 'properties', { get:
function() {
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#the-properties-of-an-item
    var itemElem = this;

    var props = [];
    function updateProperties(elemFilter) {
	var root = itemElem;

	props.length = 0;

	// when the root isn't a item in the document, match nothing
	// FIXME: the spec doesn't actually say this.
	if (!root.itemScope || !contains(document.documentElement, root))
	    return;

	var pending = [];
	function pushChildren(e) {
	    for (var child = e.lastChild; child; child = child.previousSibling) {
		if (child.nodeType == 1 && elemFilter(child)) {
		    pending.push(child);
		}
	    }
	}
	pushChildren(root);

	function getScopeNode(e) {
	    var scope = e.parentNode;
	    while (scope && !scope.itemScope)
		scope = scope.parentNode;
	    return scope;
	}
	var refIds = splitTokens(root.itemRef);
	idloop: for (var i=0; i<refIds.length; i++) {
	    var candidate = document.getElementById(refIds[i]);
	    if (!candidate || !elemFilter(candidate))
		continue;
	    var scope = getScopeNode(candidate);
	    for (var j=0; j<pending.length; j++) {
		if (candidate == pending[j])
		    continue idloop;
		if (contains(pending[j], candidate) &&
		    (pending[j] == scope ||
		     getScopeNode(pending[j]) == scope))
		    continue idloop;
	    }
	    pending.push(candidate);
	}

	// from http://www.quirksmode.org/dom/getElementsByTagNames.html
	pending.sort(function (a,b){return (a.compareDocumentPosition(b)&6)-3;});

	while (pending.length) {
	    var current = pending.pop();
	    if (current.hasAttribute('itemprop'))
		props.push(current);
	    if (!current.hasAttribute('itemscope'))
		pushChildren(current);
	}
    }

    props.names = [];
    function updateNames() {
	while (props.names.length)
	    props.names.pop();
	for (var i = 0; i < props.length; i++) {
	    var propNames = splitTokens(props[i].getAttribute('itemprop'));
	    for (var j = 0; j < propNames.length; j++) {
		if (!inList(propNames[j], props.names))
		    props.names.push(propNames[j]);
	    }
	}
    }

    function updatePropertyNodeList(pnl, name) {
	while (pnl.length)
	    pnl.pop();
	while (pnl.values.length)
	    pnl.values.pop();
	for (var i=0; i<props.length; i++) {
	    if (inList(name, splitTokens(props[i].getAttribute('itemprop')))) {
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
