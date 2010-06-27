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
function getVCard(node) {
    var hcardURI = 'http://microformats.org/profile/hcard';
    if (node) {
	while (node && (!node.itemScope || node.itemType != hcardURI))
	    node = node.parentNode;
    } else {
	node = document.getItems(hcardURI)[0];
    }

    if (!node)
	return;

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
    var title = document.getElementsByTagName("title")[0];
    if (title)
	addLine("NAME", [], escapeString(title.textContent));
    if (node.itemId)
	addLine("UID", [], escapeString(node.itemId));
    var props = node.properties;
    for (var propIndex=0; propIndex<props.length; propIndex++) {
	var prop = props[propIndex];
	for (var nameIndex=0; nameIndex<prop.itemProp.length; nameIndex++) {
	    var name = prop.itemProp[nameIndex];
	    var params = [];
	    var value;
	    function addParam(n, v) {
		params.push({name:n,value:v});
	    }
	    if (prop.itemScope) {
		var subitem = prop;
		function addTypeParam() {
		    var typeProp = subitem.properties.namedItem('type')[0];
		    if (typeProp && !typeProp.itemScope &&
			/^[0-9A-Za-z]*$/.test(typeProp.itemValue))
			addParam('TYPE', typeProp.itemValue);
		}
		function escapeProps(name) {
		    var escaped = '';
		    var allProps = subitem.properties.namedItem(name);
		    for (var i=0; i<allProps.length && !allProps[i].itemScope; i++) {
			if (escaped.length)
			    escaped += ',';
			escaped += escapeString(allProps[i].itemValue);
		    }
		    return escaped;
		}
		function escapeFirstProp(name) {
		    var firstProp = subitem.properties.namedItem(name)[0];
		    return (firstProp && !firstProp.itemScope) ? escapeString(firstProp.itemValue) : '';
		}

		if (name == 'n') {
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
		    value = escapeFirstProp('organization-name', subitem);
		    var units = subitem.properties.namedItem('organization-unit');
		    for (var unit=0; unit<units.length; unit++) {
			if (!units[unit].itemScope)
			    value += ';'+escapeString(units[unit].itemValue);
		    }
		} else if (name == 'agent' && subitem.itemType == hcardURI) {
		    value = escapeString(getVCard(subitem));
		    addParam('VALUE', 'VCARD');
		} else {
		    // the property's value is an item and name is none of the above
		    value = escapeFirstProp('value', subitem);
		    addTypeParam();
		}
	    } else {
		// the property's value is not an item
		value = prop.itemValue;
		var tag = prop.tagName.toUpperCase();
		// http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#url-property-elements
		if (/^A|AREA|AUDIO|EMBED|IFRAME|IMG|LINK|OBJECT|SOURCE|VIDEO$/.test(tag)) {
		    addParam('VALUE', 'URI');
		} else if (tag == 'TIME') {
		    if (isValidDateString(prop.itemValue)) {
			addParam('VALUE', 'DATE');
		    } else if (isValidGlobalDateAndTimeString(prop.itemValue)) {
			addParam('VALUE', 'DATE-TIME');
		    }
		}
		value = escapeString(value, name=='geo'?'\\\\,':'\\\\,;');
	    }
	    addLine(name, params, value);
	}
    }
    addLine('END', [], 'VCARD');
    return output;
}
