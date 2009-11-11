// http://www.whatwg.org/specs/vocabs/current-work/#conversion-to-icalendar
function convertToICalendar() {
    var events = document.getItems('http://microformats.org/profile/hcalendar#vevent');
    if (events.length == 0)
	return;
    var output = '';
    // http://www.whatwg.org/specs/vocabs/current-work/#add-an-icalendar-line
    function addLine(type, value, annotation) {
	var line = '';
	line += type.toUpperCase();
	if (annotation)
	    line += ';'+annotation;
	line += ':';
	line += escapeString(value);
	var maxLen = 75;
	while (line.length > maxLen) {
	    output += line.substr(0, maxLen);
	    line = line.subStr(maxLen);
	    output += '\r\n ';
	    maxLen = 74;
	}
	output += line+'\r\n';
    }
    addLine('BEGIN', 'VCALENDAR');
    addLine('PRODID', 'MicrodataJS');
    addLine('VERSION', '2.0');
    for (var eventIndex=0; eventIndex<events.length; eventIndex++) {
	var node = events[eventIndex];
	addLine('BEGIN', 'VEVENT');
	// thanks Hixie!
	var stamp = new Date();
	var stampString = '' + stamp.getUTCFullYear() + (stamp.getUTCMonth() + 1) +
	    stamp.getUTCDate() + 'T' + stamp.getUTCHours() +
	    stamp.getUTCMinutes() + stamp.getUTCSeconds() + 'Z';
	addLine('DTSTAMP', stampString, 'VALUE=DATE-TIME');
	if (node.itemId)
	    addLine('UID', node.itemId);
	for (var propIndex=0; propIndex<node.properties.length; propIndex++) {
	    var prop = node.properties[propIndex];
	    if (prop.itemScope)
		continue;
	    for (var nameIndex = 0; nameIndex < prop.itemProp.length; nameIndex++) {
		var name = prop.itemProp[nameIndex];
		if (prop.tagName.toUpperCase() == 'TIME') {
		    var value = prop.itemValue.replace(/[-:]/g, '');
		    if (isValidDateString(prop.itemValue)) {
			addLine(name, value, "VALUE=DATE");
		    } else if (isValidGlobalDateAndTimeString(prop.itemValue)) {
			addLine(name, value, "VALUE=DATE-TIME");
		    }
		} else {
		    addLine(name, prop.itemValue);
		}
	    }
	}
	addLine('END', 'VEVENT');
    }
    addLine('END', 'VCALENDAR');
    return output;
}
