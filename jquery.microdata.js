/* -*- mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil -*- */

(function(){
  jQuery.microdata = {};

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

  jQuery.microdata.isValidGlobalDateAndTimeString = isValidGlobalDateAndTimeString;
  jQuery.microdata.isValidDateString = isValidDateString;

  function splitTokens(s) {
    if (s && /\S/.test(s))
      return s.replace(/^\s+|\s+$/g,'').split(/\s+/);
    return [];
  }

  function getItems(types) {
    var selector = jQuery.map(splitTokens(types), function(t) {
      return '[itemtype~="'+t.replace(/"/g, '\\"')+'"]';
    }).join(',') || '*';
    // filter results to only match top-level items
    // because [attr] selector doesn't work in IE we have to
    // filter the elements. http://dev.jquery.com/ticket/5637
    return jQuery(selector, this).filter(function() {
      return (this.getAttribute('itemscope') != null &&
              this.getAttribute('itemprop') == null);
    });
  };

  function itemScope(val) {
    if (arguments.length == 0) {
      return this.attr('itemscope') != undefined;
    } else {
      if (val) {
        this.attr('itemscope', 'itemscope');
      } else {
        this.removeAttr('itemscope');
      }
    }
    return this;
  }

  function itemType(val) {
    if (arguments.length == 0) {
      return this.attr('itemtype') || '';
    } else {
      this.attr('itemtype', val);
    }
    return this;
  }

  function resolve(url) {
    if (!url)
      return '';
    var img = document.createElement('img');
    img.setAttribute('src', url);
    return img.src;
  }

  function itemId(val) {
    if (arguments.length == 0) {
      return resolve(this.attr('itemid'));
    } else {
      this.attr('itemid', val);
    }
    return this;
  }

  function tokenList(attr) {
    return function() {
      var tokens = [];
      jQuery.each(splitTokens(this.attr(attr)), function(i, token) {
        if (jQuery.inArray(token, tokens) == -1)
          tokens.push(token);
      });
      return jQuery(tokens);
    };
  }

  function itemValue(val) {
    var elm = this.get(0);
    var tag = elm.tagName.toUpperCase();
    if (arguments.length == 0) {
      if (this.attr('itemprop') === undefined)
        return null;
      if (this.itemScope()) {
        return elm; // or a new jQuery object?
      }
      switch (tag) {
      case 'META':
        return this.attr('content') || '';
      case 'AUDIO':
      case 'EMBED':
      case 'IFRAME':
      case 'IMG':
      case 'SOURCE':
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
    } else {
      switch (tag) {
      case 'META':
        return this.attr('content', val);
      case 'AUDIO':
      case 'EMBED':
      case 'IFRAME':
      case 'IMG':
      case 'SOURCE':
      case 'VIDEO':
        return this.attr('src', val);
      case 'A':
      case 'AREA':
      case 'LINK':
        return this.attr('href', val);
      case 'OBJECT':
        return this.attr('data', val);
      case 'TIME':
        if (!(this.attr('datetime') === undefined))
          return this.attr('datetime', val);
      default:
        return this.text(val);
      }
    }
  }

  function properties() {
    function collectElements(root) {
      // Let results and pending be empty lists of elements.
      var results = [];
      var pending = [];

      function pushChildren(elm) {
        pending.push.apply(pending, jQuery(elm).children().toArray());
      }

      // Add all the children elements of root to pending.
      pushChildren(root);

      // If root has an itemref attribute...
      // FIXME: itemRef() hides duplicate IDs
      jQuery(root).itemRef().each(function(i, id) {
        // FIXME: look in home tree, not document
        var $ref = jQuery('#'+id);
        if ($ref.get(0))
          pending.push($ref.get(0));
      });

      // Loop...
      var current;
      while ((current = pending.pop())) {
        results.push(current);
        if (!jQuery(current).itemScope())
          pushChildren(current);
      }

      return results;
    }

    function crawlProperties(root, memory) {
      if (jQuery.inArray(root, memory) != -1) {
        //alert('FAIL: root in memory');
        return undefined;
      }

      var results = collectElements(root);

      if (jQuery.inArray(root, results) != -1) {
        //alert('FAIL: root in results');
        return undefined;
      }

      // If any elements are listed in results more than once, then
      // the algorithm fails; abort these steps.
      for (var i=0; i<results.length; i++) {
        for (var j=0; j<results.length; j++) {
          if (i != j && results[i] == results[j]) {
            //alert('FAIL: duplicate element');
            return undefined;
          }
        }
      }

      results = jQuery.grep(results, function(elm) {
        return jQuery(elm).itemProp();
      });

      var newMemory = memory.concat([root]);

      for (i=0; i<results.length; i++) {
        if (results[i].hasAttribute('itemscope')) {
          var subResults = crawlProperties(results[i], newMemory);
          if (subResults == undefined) {
            //alert('FAIL: recursive crawl failed');
            return undefined;
          }
        }
      }

      // from http://www.quirksmode.org/dom/getElementsByTagNames.html
      results.sort(function (a,b){return 3-(a.compareDocumentPosition(b)&6);});

      return results;
    }

    return jQuery(crawlProperties(this.get(0), []));
  }

  jQuery.fn.extend({
    items     : getItems,
    itemScope : itemScope,
    itemType  : itemType,
    itemId    : itemId,
    itemProp  : tokenList('itemprop'),
    itemRef   : tokenList('itemref'),
    itemValue : itemValue,
    properties: properties
  });
})();
