/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#json
jQuery.microdata.json = function(selector, format) {
  function getObject($item) {
    var result = {};
    if ($item.itemType())
      result.type = $item.itemType();
    if ($item.itemId())
      result.id = $item.itemId();
    result.properties = {};
    $item.properties().each(function() {
      var $elem = jQuery(this);
      var value;
      if ($elem.itemScope())
        value = getObject($elem);
      else
        value = $elem.itemValue();
      $elem.itemProp().each(function() {
        if (!result.properties[this])
          result.properties[this] = [];
        result.properties[this].push(value);
      });
    });
    return result;
  }

  var result = {};
  result.items = [];
  var $items = selector ? jQuery(selector) : jQuery(document).items();
  $items.each(function(i, item) {
    var $item = jQuery(item);
    if ($item.itemScope())
      result.items.push(getObject($item));
  });
  return format ? format(result) : JSON.stringify(result, undefined, 2);
};
