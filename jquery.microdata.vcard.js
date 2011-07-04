/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#conversion-to-vcard
jQuery.microdata.vcard = function(selector) {
  var vcardURI = 'http://microformats.org/profile/hcard';

  function extract($vcard) {
    var output = '';
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#add-a-vcard-line
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
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#escaping-the-vcard-text-string
    function escapeString(value, chars) {
      var re = new RegExp('(['+(chars||'\\\\,;')+'])', 'g');
      return value.replace(re, '\\$1').replace(/\r\n|\r|\n/g, '\\n');
    }
    addLine("BEGIN", [], "VCARD");
    addLine("PROFILE", [], "VCARD");
    addLine("VERSION", [], "3.0");
    addLine("SOURCE", [], escapeString(document.location.href));
    var $title = jQuery("title").first();
    if ($title.length > 0)
      addLine("NAME", [], escapeString($title.text()));
    if ($vcard.itemId())
      addLine("UID", [], escapeString($vcard.itemId()));
    $vcard.properties().each(function() {
      var $prop = jQuery(this);
      $prop.itemProp().each(function() {
        var name = this;
        var params = [];
        var value;
        function addParam(n, v) {
          params.push({name:n,value:v});
        }
        if ($prop.itemScope()) {
          var $subitem = $prop;
          function addTypeParam() {
            var $type = $subitem.properties('type').first();
            if ($type.length > 0 && !$type.itemScope() &&
                /^[0-9A-Za-z]*$/.test($type.itemValue()))
              addParam('TYPE', $type.itemValue());
          }
          function escapeProps(name) {
            return $subitem.properties(name)
              .filter(function(){return !jQuery(this).itemScope();})
              .map(function(){return escapeString(jQuery(this).itemValue());})
              .toArray().join(',');
          }
          function escapeFirstProp(name) {
            var $first = $subitem.properties(name).first();
            return ($first.length > 0 && !$first.itemScope()) ? escapeString($first.itemValue()) : '';
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
            value = escapeFirstProp('organization-name', $subitem);
            $subitem.properties('organization-unit').each(function() {
              if (!jQuery(this).itemScope())
                value += ';' + escapeString(jQuery(this).itemValue());
            });
          } else if (name == 'agent' && $subitem.itemType() == vcardURI) {
            value = escapeString(extract($subitem));
            addParam('VALUE', 'VCARD');
          } else {
            // the property's value is an item and name is none of the above
            value = escapeFirstProp('value', $subitem);
            addTypeParam();
          }
        } else {
          // the property's value is not an item
          value = $prop.itemValue();
          var tag = $prop.get(0).tagName.toUpperCase();
          // http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#url-property-elements
          if (/^A|AREA|AUDIO|EMBED|IFRAME|IMG|LINK|OBJECT|SOURCE|TRACK|VIDEO$/.test(tag)) {
            addParam('VALUE', 'URI');
          } else if (tag == 'TIME') {
            if (jQuery.microdata.isValidDateString($prop.itemValue())) {
              addParam('VALUE', 'DATE');
            } else if (jQuery.microdata.isValidGlobalDateAndTimeString($prop.itemValue())) {
              addParam('VALUE', 'DATE-TIME');
            }
          }
          value = escapeString(value, name=='geo'?'\\\\,':'\\\\,;');
        }
        addLine(name, params, value);
      });
    });
    addLine('END', [], 'VCARD');
    return output;
  }

  var $vcard = (selector ?
                jQuery(selector).filter(function() {
                  var $this = jQuery(this);
                  return $this.itemScope() && $this.itemType() == vcardURI;
                }) :
                jQuery(document).items(vcardURI)).first();
  if ($vcard.length == 1)
    return extract($vcard);
};
