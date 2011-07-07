/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

(function(){
  var $ = jQuery;

  $.microdata = {};

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

  $.microdata.isValidGlobalDateAndTimeString = isValidGlobalDateAndTimeString;
  $.microdata.isValidDateString = isValidDateString;

  function splitTokens(s) {
    if (s && /\S/.test(s))
      return s.replace(/^\s+|\s+$/g,'').split(/\s+/);
    return [];
  }

  function getItems(types) {
    var doc = this[0];
    if (doc.getItems)
      return $(types ? doc.getItems(types) : doc.getItems());
    var selector = $.map(splitTokens(types), function(t) {
      return '[itemtype~="'+t.replace(/"/g, '\\"')+'"]';
    }).join(',') || '*';
    // filter results to only match top-level items
    // because [attr] selector doesn't work in IE we have to
    // filter the elements. http://dev.jquery.com/ticket/5637
    return $(selector, this).filter(function() {
      return (this.getAttribute('itemscope') != null &&
              this.getAttribute('itemprop') == null);
    });
  }

  function resolve(url) {
    if (!url)
      return '';
    var img = document.createElement('img');
    img.setAttribute('src', url);
    return img.src;
  }

  function tokenList(attr) {
    return function() {
      return $(splitTokens(this.attr(attr)));
    };
  }

  function itemValue() {
    var elm = this[0];
    if (this.attr('itemprop') === undefined)
      return null;
    if (this.itemScope()) {
      return elm; // or a new jQuery object?
    }
    switch (elm.tagName.toUpperCase()) {
    case 'META':
      return this.attr('content') || '';
    case 'AUDIO':
    case 'EMBED':
    case 'IFRAME':
    case 'IMG':
    case 'SOURCE':
    case 'TRACK':
    case 'VIDEO':
      return resolve(this.attr('src'));
    case 'A':
    case 'AREA':
    case 'LINK':
      return resolve(this.attr('href'));
    case 'OBJECT':
      return resolve(this.attr('data'));
    case 'TIME':
      var datetime = this.attr('datetime');
      if (!(datetime === undefined))
        return datetime;
    default:
      return this.text();
    }
  }

  function properties(name) {
    if (!this.itemScope())
      return $();

    var root = this[0];

    // 1. Let results, memory, and pending be empty lists of elements.
    var results = [];
    var memory = [];
    var pending = [];

    function addChildren(elm) {
      $(elm).children().each(function(i, child) {
        pending.push(child);
      });
    }

    // 2. Add the element root to memory.
    memory.push(root);

    // 3. Add the child elements of root, if any, to pending.
    addChildren(root);

    // 4. If root has an itemref attribute, split the value of that
    // itemref attribute on spaces. For each resulting token ID, if
    // there is an element in the home subtree of root with the ID ID,
    // then add the first such element to pending.
    var context = root;
    while (context.parentNode)
      context = context.parentNode;
    $(root).itemRef().each(function(i, id) {
      var $ref = $('#'+id, context);
      if ($ref.length)
        pending.push($ref[0]);
    });

    // 5. Loop: If pending is empty, jump to the step labeled end of loop.
    while (pending.length) {
      // 6. Remove an element from pending and let current be that element.
      var current = pending.pop();

      // 7. If current is already in memory, there is a microdata
      // error; return to the step labeled loop.
      if (memory.indexOf(current) != -1)
        continue;

      // 8. Add current to memory.
      memory.push(current);

      // 9. If current does not have an itemscope attribute, then: add
      // all the child elements of current to pending.
      if (!$(current).itemScope())
        addChildren(current);

      // 10. If current has an itemprop attribute specified, add it to results.
      // SPEC VIOLATION: itemprop="" does not add to results
      var $names = $(current).itemProp();
      if ($names.length) {
        if (!name || $names.toArray().indexOf(name) != -1)
          results.push(current);
      }

      // 11. Return to the step labeled loop.
    }

    // 12. End of loop: Sort results in tree order.
    $.unique(results);

    // 13. Return results.
    return $(results);
  }

  // feature detection to use native support where available
  var t = $('<div itemscope itemtype="type" itemid="id" itemprop="prop" itemref="ref">')[0];

  $.fn.extend({
    items: getItems,
    itemScope: t.itemScope ? function() {
      return this[0].itemScope;
    } : function () {
      return this.attr('itemscope') != undefined;
    },
    itemType: t.itemType ? function() {
      return this[0].itemType;
    } : function () {
      return this.attr('itemtype') || '';
    },
    itemId: t.itemId ? function() {
      return this[0].itemId;
    } : function () {
      return resolve(this.attr('itemid'));
    },
    itemProp: t.itemProp && t.itemProp.length ? function() {
      return $(this[0].itemProp);
    } : tokenList('itemprop'),
    itemRef: t.itemRef && t.itemRef.length ? function() {
      return $(this[0].itemRef);
    } : tokenList('itemref'),
    itemValue: t.itemValue ? function() {
      return this[0].itemValue;
    } : itemValue,
    properties: t.properties && t.properties.namedItem ? function(name) {
      return $(name ? this[0].properties.namedItem(name) : this[0].properties);
    } : properties
  });
})();
