// http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#json
function getJSON(nodes, format) {
    function getObject(item) {
	var result = {};
	if (item.itemType)
	    result.type = item.itemType;
	if (item.itemId)
	    result.id = item.itemId;
	result.properties = {};
	for (var propIndex=0; propIndex<item.properties.length; propIndex++) {
	    var elem = item.properties[propIndex];
	    var value;
	    if (elem.itemScope)
		value = getObject(elem);
	    else
		value = elem.itemValue;
	    for (var nameIndex=0; nameIndex<elem.itemProp.length; nameIndex++) {
		var name = elem.itemProp[nameIndex];
		if (!result.properties[name])
		    result.properties[name] = [];
		result.properties[name].push(value);
	    }
	}
	return result;
    }
    var result = {};
    result.items = [];
    for (var nodeIndex=0; nodeIndex<nodes.length; nodeIndex++) {
	if (nodes[nodeIndex].itemScope && !nodes[nodeIndex].hasAttribute('itemprop'))
	    result.items.push(getObject(nodes[nodeIndex]));
    }
    return format ? format(result) : JSON.stringify(result, undefined, 2);
}
