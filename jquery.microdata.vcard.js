/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#conversion-to-vcard
jQuery.microdata.vcard = function(selector) {
  'use strict';

  var $ = jQuery;

  var vcardURI = 'http://microformats.org/profile/hcard';

  function extract($vcard, memory) {
    var output = '';
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#add-a-vcard-line
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
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#escaping-the-vcard-text-string
    function escapeString(value, chars) {
      var re = new RegExp('(['+(chars||'\\\\,;')+'])', 'g');
      return value.replace(re, '\\$1').replace(/\r\n|\r|\n/g, '\\n');
    }
    addLine('BEGIN', [], 'VCARD');
    addLine('PROFILE', [], 'VCARD');
    addLine('VERSION', [], '3.0');
    addLine('SOURCE', [], escapeString(document.location.href));
    var $title = $('title').first();
    if ($title.length > 0)
      addLine('NAME', [], escapeString($title.text()));
    $vcard.properties().each(function() {
      var $prop = $(this);
      $.each($prop.itemProp(), function() {
        var name = this;
        var params = [];
        var value;
        function addParam(n, v) {
          params.push({name:n,value:v});
        }
        function addTypeParam() {
          var $type = $subitem.properties('type').first();
          if ($type.length > 0 && !$type.itemScope() &&
              /^[0-9A-Za-z]*$/.test($type.itemValue()))
            addParam('TYPE', $type.itemValue());
        }
        function escapeProps(name) {
          return $subitem.properties(name)
            .filter(function(){return !$(this).itemScope();})
            .map(function(){return escapeString($(this).itemValue());})
            .toArray().join(',');
        }
        function escapeFirstProp(name) {
          var $first = $subitem.properties(name).first();
          return ($first.length > 0 && !$first.itemScope()) ? escapeString($first.itemValue()) : '';
        }

        if ($prop.itemScope()) {
          var $subitem = $prop;
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
              if (!$(this).itemScope())
                value += ';' + escapeString($(this).itemValue());
            });
          } else if (name == 'agent' && $subitem.itemType().contains(vcardURI)) {
            if ($.inArray($subitem[0], memory) != -1) {
              value = 'ERROR';
            } else {
              memory.push($vcard[0]);
              value = escapeString(extract($subitem, memory));
              memory.pop();
            }
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
          // http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#url-property-elements
          if (/^A|AREA|AUDIO|EMBED|IFRAME|IMG|LINK|OBJECT|SOURCE|TRACK|VIDEO$/.test(tag)) {
            addParam('VALUE', 'URI');
          } else if (tag == 'TIME') {
            if ($.microdata.isValidDateString($prop.itemValue())) {
              addParam('VALUE', 'DATE');
            } else if ($.microdata.isValidGlobalDateAndTimeString($prop.itemValue())) {
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
                $(selector).filter(function() {
                  var $this = $(this);
                  return $this.itemScope() && $this.itemType().contains(vcardURI);
                }) :
                $(document).items(vcardURI)).first();
  if ($vcard.length == 1)
    return extract($vcard, []);
};
