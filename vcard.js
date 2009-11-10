// http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-time-string
function validTimeStringLength(s) {
    var m = /^(\d\d):(\d\d)(:(\d\d)(\.\d+)?)?/.exec(s);
    if (m && m[1]<=23 && m[2]<=59 && (!m[4] || m[4]<=59))
	return m[0].length;
    return 0;
}

function isValidTimeString(s) {
    return s && validTimeStringLength(s) == s.length;
}

// http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#number-of-days-in-month-month-of-year-year
function daysInMonth(year, month) {
    if (month==1 || month==3 || month==5 || month==7 ||
	month==8 || month==10 || month==12) {
	return 31;
    } else if (month==4 || month==6 || month==9 || month==11) {
	return 30;
    } else if (month == 2 && (year%400==0 || (year%4==0 && year%100!=0))) {
	return 29;
    } else {
	return 28;
    }
}

// http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-date-string
function validDateStringLength(s) {
    var m = /^(\d{4,})-(\d\d)-(\d\d)/.exec(s);
    if (m && m[1]>=1 && m[2]>=1 && m[2]<=12 && m[3]>=1 && m[3]<=daysInMonth(m[1],m[2]))
	return m[0].length;
    return 0;
}

function isValidDateString(s) {
    return s && validDateStringLength(s) == s.length;
}

// http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-global-date-and-time-string
function isValidGlobalDateAndTimeString(s) {
    var skip = validDateStringLength(s);
    if (skip && s[skip] == 'T') {
	s = s.substr(skip+1);
	skip = validTimeStringLength(s);
	if (skip) {
	    s = s.substr(skip);
	    if (s == 'Z')
		return true;
	    var m = /^[+-](\d\d):(\d\d)$/.exec(s);
	    if (m && m[1]<=23 && m[2]<=59)
		return true;
	}
    }
    return false;
}

// http://www.whatwg.org/specs/vocabs/current-work/#escaping-the-vcard-text-string
function escapeString(value, chars) {
    var re = new RegExp('(['+(chars||'\\\\,;')+'])', 'g');
    return value.replace(re, '\\$1').replace(/\r\n|\r|\n/g, '\\n');
}

// http://www.whatwg.org/specs/vocabs/current-work/#conversion-to-vcard
// begins with input node at step 2 in the algorithm
function extract_vCard(node) {
    var output = '';
    // http://www.whatwg.org/specs/vocabs/current-work/#add-a-vcard-line
    function addLine(type, params, value) {
	var line = '';
	line += type.toUpperCase();
	for (var i=0; i<params.length; i++) {
	    line += ';';
	    line += params[i].name;
	    line += '=';
	    line += params[i].value;
	}
	line += ':';
	line += value;
	var maxLen = 75;
	while (line.length > maxLen) {
	    output += line.substr(0, maxLen);
	    line = line.substr(maxLen);
	    output += '\r\n ';
	    maxLen = 74;
	}
	output += line;
	output += '\r\n';
    }

    addLine("BEGIN", [], "VCARD");
    addLine("PROFILE", [], "VCARD");
    addLine("VERSION", [], "3.0");
    addLine("SOURCE", [], escapeString(document.location.href));
    // FIXME: is this the title element as per spec?
    var title = document.getElementsByTagName("title")[0];
    if (title)
	addLine("NAME", [], escapeString(title.textContent));
    if (node.itemId)
	addLine("UID", [], escapeString(node.itemId));
    var firstN = null;
    var firstOrg = null;
    var firstFN = null;
    var props = node.properties;
    for (var i=0; i<props.length; i++) {
	// FIXME: element's property names?
	var nameList = splitTokens(props[i].itemProp);
	for (var j=0; j<nameList.length; j++) {
	    var name = nameList[j];
	    var params = [];
	    var value;
	    function addParam(n, v) {
		params.push({name:n,value:v});
	    }
	    if (props[i].itemScope) {
		var subitem = props[i];
		function addTypeParam() {
		    var prop = subitem.properties.namedItem('type')[0];
		    if (prop && !prop.itemScope &&
			/^[0-9A-Za-z]*$/.test(prop.itemValue))
			addParam('TYPE', prop.itemValue);
		}
		function escapeProps(name) {
		    var value = '';
		    var props = subitem.properties.namedItem(name);
		    for (var p=0; p<props.length && !props[p].itemScope; p++) {
			if (value.length)
			    value += ',';
			value += escapeString(props[p].itemValue);
		    }
		    return value;
		}
		function escapeFirstProp(name) {
		    var prop = subitem.properties.namedItem(name)[0];
		    return (prop && !prop.itemScope) ? escapeString(prop.itemValue) : '';
		}

		if (name == 'n') {
		    if (firstN == null)
			firstN = subitem;
		    value = escapeFirstProp('family-name')+';'+
			escapeFirstProp('given-name')+';'+
			escapeFirstProp('additional-name')+';'+
			escapeFirstProp('honorific-prefix')+';'+
			escapeFirstProp('honorific-suffix');
		} else if (name == 'adr') {
		    value = escapeProps('post-office-box')+';'+
			escapeProps('extended-address')+';'+
			escapeProps('street-address')+';'+
			escapeFirstProp('locality')+';'+
			escapeFirstProp('region')+';'+
			escapeFirstProp('postal-code')+';'+
			escapeFirstProp('country-name');
		    addTypeParam();
		} else if (name == 'org') {
		    if (firstOrg == null)
			firstOrg = subitem;
		    value = escapeFirstProp('organization-name', subitem);
		    var units = subitem.properties.namedItem('organization-unit');
		    for (var unit=0; unit<units.length; unit++) {
			if (!units[unit].itemScope)
			    value += ';'+escapeString(units[unit].itemValue);
		    }
		} else if (name == 'agent' &&
			   subitem.itemType == 'http://microformats.org/profile/hcard') {
		    value = escapeString(extract_vCard(subitem));
		    addParam('VALUE', 'VCARD');
		} else {
		    // the property's value is an item and name is none of the above
		    value = escapeFirstProp('value', subitem);
		    addTypeParam();
		}
	    } else {
		var elem = props[i];
		// the property's value is not an item
		if (name == 'fn' && firstFN == null) {
		    firstFN = elem;
		} else if (name == 'org' && firstOrg == null) {
		    firstOrg = elem;
		}
		value = elem.itemValue;
		var tag = elem.tagName.toUpperCase();
		// http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#url-property-elements
		if (/^A|AREA|AUDIO|EMBED|IFRAME|IMG|LINK|OBJECT|SOURCE|VIDEO$/.test(tag)) {
		    addParam('VALUE', 'URI');
		} else if (tag == 'TIME') {
		    if (isValidDateString(elem.itemValue)) {
			addParam('VALUE', 'DATE');
		    } else if (isValidGlobalDateAndTimeString(elem.itemValue)) {
			addParam('VALUE', 'DATE-TIME');
		    }
		}
		value = escapeString(value, name=='geo'?'\\\\,':'\\\\,;');
	    }
	    addLine(name, params, value);
	}
    }
    if (firstN == null) {
	if (firstFN == null || firstFN.itemScope) {
	    alert('FIXME! SKIP!');
	}
	if (firstOrg != null && !firstOrg.itemScope && firstOrg == firstFN) {
	    alert('company vcard?');
	}
	var m = /^(\S+)(\s+(\S+))?$/.exec(firstFN.itemValue);
	if (m) {
	    var p1 = m[1];
	    var p2 = m[3] || '';
	    function addN(first, second) {
		var value = escapeString(first)+';'+escapeString(second)+';;;';
		addLine('N', [], value);
	    }
	    if (p1[p1.length-1] == ',') {
		addN(p1.substr(0, p1.length-1), p2);
	    } else if (p2.length==2 && p2[1]=='.') {
		addN(p1, p2[0]);
	    } else if (p2.length==1) {
		addN(p1, p2);
	    } else {
		addN(p2, p1);
	    }
	}
    }
    addLine('END', [], 'VCARD');
    return output;
}
