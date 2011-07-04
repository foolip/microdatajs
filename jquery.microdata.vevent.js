/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#conversion-to-icalendar
jQuery.microdata.ical = function(selector) {
  var veventURI = 'http://microformats.org/profile/hcalendar#vevent';
  var $events = selector ?
    jQuery(selector).filter(function() {
      var $this = jQuery(this);
      return $this.itemScope() && $this.itemType() == veventURI;
    }) :
    jQuery(document).items(veventURI);
  if ($events.length == 0)
    return;

  var output = '';
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#add-an-icalendar-line
  function addLine(type, value, annotation) {
    var line = '';
    line += type.toUpperCase();
    if (annotation)
      line += ';'+annotation;
    line += ':';
    line += value.replace(/([\\,;])/g, '\\$1').replace(/\r\n|\r|\n/g, '\\n');
    var maxLen = 75;
    while (line.length > maxLen) {
      output += line.substr(0, maxLen);
      line = line.substr(maxLen);
      output += '\r\n ';
      maxLen = 74;
    }
    output += line+'\r\n';
  }
  addLine('BEGIN', 'VCALENDAR');
  addLine('PRODID', 'jQuery Microdata');
  addLine('VERSION', '2.0');
  $events.each(function() {
    var $event = jQuery(this);
    addLine('BEGIN', 'VEVENT');
    function zp(n) { return (n < 10 ? '0' : '') + n; }
    var stamp = new Date();
    var stampString = '' + stamp.getUTCFullYear() + zp(stamp.getUTCMonth() + 1) +
        zp(stamp.getUTCDate()) + 'T' + zp(stamp.getUTCHours()) +
        zp(stamp.getUTCMinutes()) + zp(stamp.getUTCSeconds()) + 'Z';
    addLine('DTSTAMP', stampString, 'VALUE=DATE-TIME');
    if ($event.itemId())
      addLine('UID', $event.itemId());
    $event.properties().each(function() {
      var $elem = jQuery(this);
      if ($elem.itemScope())
        return;
      $elem.itemProp().each(function() {
        var name = this;
        if ($elem.get(0).tagName.toUpperCase() == 'TIME') {
          var value = $elem.itemValue().replace(/[-:]/g, '');
          if (jQuery.microdata.isValidDateString($elem.itemValue())) {
            addLine(name, value, "VALUE=DATE");
          } else if (jQuery.microdata.isValidGlobalDateAndTimeString($elem.itemValue())) {
            addLine(name, value, "VALUE=DATE-TIME");
          }
        } else {
          addLine(name, $elem.itemValue());
        }
      });
    });
    addLine('END', 'VEVENT');
  });
  addLine('END', 'VCALENDAR');
  return output;
};
