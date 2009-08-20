function splitTypes(s) {
    if (s) return s.split(/\s+/);
    return [];
}

function inList(item, list) {
    for (var i = 0; i < list.length; i++) {
	if (item == list[i])
	    return true;
    }
    return false;
}

function isSubset(sub, sup) {
    for (var i = 0; i < sub.length; i++) {
	if (!inList(sub[i], sup))
	    return false;
    }
    return true;
}

function getElementsByFilter(pred) {
    var elems = [];
    function filterNode(elem) {
	if (pred(elem))
	    elems.push(elem);
	for (var child = elem.firstChild; child; child = child.nextSibling) {
	    if (child.nodeType == 1) {
		filterNode(child);
	    }
	}
    }
    filterNode(document.documentElement);
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

function filterItems(correspondingItem) {
    return filter(itemNodes, function (x) {
		      return getCorrespondingItem(x) == correspondingItem;
		  });
}

Element.prototype.__defineGetter__('item', function () { return this.getAttribute('item'); });

Element.prototype.__defineGetter__('itemprop', function () { return this.getAttribute('itemprop'); });

Element.prototype.__defineGetter__("properties",
function() {
    // If the element has an item attribute, returns an
    // HTMLPropertyCollection object with all the element's
    // properties.
    var elems;
    if (this.hasAttribute('item')) {
	var itemelem = this; /* this in inline function is window */
	elems = getElementsByFilter(function(e){return e.hasAttribute('itemprop') &&
						splitTypes(e.getAttribute('itemprop')).length &&
						getCorrespondingItem(e) == itemelem;});
    } else {
	// Otherwise, an empty HTMLPropertyCollection object.
	elems = [];
    }

    elems.names = [];
    for (var i = 0; i < elems.length; i++) {
	var elemNames = splitTypes(elems[i].getAttribute('itemprop'));
	for (var j = 0; j < elemNames.length; j++) {
	    if (!inList(elemNames[j], elems.names))
		elems.names.push(elemNames[j]);
	}
    }

    elems.item = function(idx){try{return this[idx];}catch(x){return null;}};

    elems.namedItem = function (name) {
	var namedElems = filter(elems, function(e){return inList(name, splitTypes(e.getAttribute('itemprop')));});
	namedElems.item = function(idx){return this[idx];};
	namedElems.contents = map(namedElems, function(e){return e.content;});
	return namedElems;
    };

    return elems;
});

Element.prototype.__defineGetter__("content",
function() {
    if (this.tagName == 'META')
	return this.getAttribute('content');
    if (this.tagName == 'AUDIO' || this.tagName == 'EMBED' ||
	this.tagName == 'IFRAME' || this.tagName == 'IMG' ||
	this.tagName == 'SOURCE' || this.tagName == 'VIDEO')
	return this.src;
    if (this.tagName == 'A' || this.tagName == 'AREA' || this.tagName == 'LINK')
	return this.href;
    if (this.tagName == 'OBJECT')
	return this.data;
    if (this.tagName == 'TIME' && this.hasAttribute('datetime'))
	return this.getAttribute('datetime');
    return this.textContent;
});

Element.prototype.__defineGetter__('subject', function () { return this.getAttribute('subject'); });

function getCorrespondingItem(node) {
    if (node.hasAttribute('subject'))
	return document.getElementById(node.getAttribute('subject'));
    var ancestor = node.parentNode;
    while (ancestor && ancestor.nodeType == 1) {
	if (ancestor.hasAttribute('item'))
	    return ancestor;
	ancestor = ancestor.parentNode;
    }
    return null;
}

Document.prototype.getItems = function(typeNames) {
    //var xpr = document.evaluate('//*[@item]', root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    //this.length = xpr.snapshotLength;
    //this.item = function(i) { return xpr.snapshotItem(i); };

    var types = splitTypes(typeNames);
    var items = getElementsByFilter(function(e){return e.hasAttribute('item') &&
						isSubset(types, splitTypes(e.getAttribute('item'))) &&
						getCorrespondingItem(e) == null;});

    items.item = function(idx){return items[idx];};

    return items;
};

// FIXME: not in spec
Document.prototype.__defineGetter__('items', function () { return this.getItems(); });
