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

function splitTypes(s) {
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

    // keep collection up to date if possible
    if (rootElem.addEventListener) {
	rootElem.addEventListener('DOMAttrModified', updateSimple, false);
	rootElem.addEventListener('DOMNodeInserted', updateSimple, false);
	rootElem.addEventListener('DOMNodeRemoved',
	    function(ev) {
		update(function(e){return e != ev.target && incFilter(e);},
		       function(e){return e != ev.target;});
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

function getItemValueProperty(e) {
    if (e.tagName == 'META')
	return 'content';
    if (e.tagName == 'AUDIO' || e.tagName == 'EMBED' ||
	e.tagName == 'IFRAME' || e.tagName == 'IMG' ||
	e.tagName == 'SOURCE' || e.tagName == 'VIDEO')
	return 'src';
    if (e.tagName == 'A' || e.tagName == 'AREA' || e.tagName == 'LINK')
	return 'href';
    if (e.tagName == 'OBJECT')
	return 'data';
    if (e.tagName == 'TIME' && e.hasAttribute('datetime'))
	return 'datetime';
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
    function hasProperty(e) {
	return e.hasAttribute('itemprop') &&
	    /\S/.test(e.getAttribute('itemprop'));
    }

    var props = fakeCollection(this, hasProperty);

    props.names = [];
    for (var i = 0; i < props.length; i++) {
	var propNames = splitTypes(props[i].getAttribute('itemprop'));
	for (var j = 0; j < propNames.length; j++) {
	    if (!inList(propNames[j], props.names))
		props.names.push(propNames[j]);
	}
    }

    // FIXME: should be live
    props.namedItem = function (name) {
	var namedElems = filter(elems, function(e){return inList(name, splitTypes(e.getAttribute('itemprop')));});
	namedElems.item = function(idx){return this[idx];};
	namedElems.contents = map(namedElems, function(e){return e.content;});
	return namedElems;
    };

    return props;
}});

// document.getItems

document.getItems = function(typeNames) {
    var types = splitTypes(typeNames);

    function isTopLevelItem(e) {
	return e.hasAttribute('itemscope') &&
	    !e.hasAttribute('itemprop') &&
	    (types.length == 0 ||
	     inList(e.getAttribute('itemtype'), types));
    }

    return fakeCollection(this.documentElement, isTopLevelItem);
};
