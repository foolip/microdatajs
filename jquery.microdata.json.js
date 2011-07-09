/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

// http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#json
jQuery.microdata.json = function(selector, format) {
  var $ = jQuery;

  function getObject(item, memory) {
    var $item = $(item);
    var result = {};
    if ($item.itemType())
      result.type = $item.itemType();
    if ($item.itemId())
      result.id = $item.itemId();
    result.properties = {};
    $item.properties().each(function(i, elem) {
      var $elem = $(elem);
      var value;
      if ($elem.itemScope()) {
        if ($.inArray(elem, memory) != -1) {
          value = 'ERROR';
        } else {
          memory.push(item);
          value = getObject(elem, memory);
          memory.pop();
        }
      } else {
        value = $elem.itemValue();
      }
      $elem.itemProp().each(function(i, prop) {
        if (!result.properties[prop])
          result.properties[prop] = [];
        result.properties[prop].push(value);
      });
    });
    return result;
  }

  var result = {};
  result.items = [];
  var $items = selector ? $(selector) : $(document).items();
  $items.each(function(i, item) {
    var $item = $(item);
    if ($item.itemScope())
      result.items.push(getObject(item, []));
  });
  return format ? format(result) : JSON.stringify(result);
};
