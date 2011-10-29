/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

function update(iframe, html) {
  // update preview
  var doc = iframe.contentWindow.document;
  doc.open();
  // new non-void elements in HTML5. IE parses these as void elements
  // unless one has previously called createElement for it.
  $.each(['section', 'article', 'aside', 'data', 'hgroup', 'header', 'footer',
          'nav', 'figure', 'figcaption', 'video', 'audio', 'mark', 'progress',
          'meter', 'ruby', 'rt', 'rp', 'bdi', 'canvas', 'details', 'datalist',
          'output'],
         function(i, tagName) { doc.createElement(tagName); });
  // shrink iframe to max(150, height) (replace with <iframe seamless>?)
  $(iframe.contentWindow).load(function() {
    $(iframe).height(150);
    $(iframe).height($(doc).height());
  });
  doc.write(html);
  doc.close();
  // insert <base href> to make shorter/prettier URLs in output
  if ($('base[href]', doc).length == 0) {
    $('head', doc).append($('<base href="http://example.com/">', doc));
  }
  // update permalink
  $('.permalink a').attr('href', '?html='+encodeURIComponent(html));
  // update selected tab
  updateTab(iframe, $('#tabs').tabs('option', 'selected'));
}

function pre(text) {
  return $('<pre>'+text.replace(/&/g, '&amp;').replace(/</g, '&lt;')+'</pre>');
}

function downloadIt(mime, data) {
  return $('<a class="download" href="data:'+mime+';charset=UTF-8,'+encodeURI(data)+'">Download it!</a>');
}

function updateTab(iframe, index) {
  var tabs = [
    {
      id: 'json',
      name: 'top-level',
      spec: 'top-level-microdata-items',
      update: function($tab, $items) {
        var jsonText = $.microdata.json($items, function(o) { return JSON.stringify(o, undefined, 2); });
        $tab.append(pre(jsonText));
        $tab.append(downloadIt('application/json', jsonText));
      }
    },
    {
      id: 'vcard',
      type: 'http://microformats.org/profile/hcard',
      name: 'vCard',
      spec: 'vcard',
      update: function($tab, $items) {
        $items.each(function(i, node) {
          var vcardText = $.microdata.vcard(node);
          if (i > 0)
            $tab.append(document.createElement('hr'));
          $tab.append(pre(vcardText));
          $tab.append(downloadIt('text/directory;profile=vCard', vcardText));
        });
      }
    },
    {
      id: 'ical',
      type: 'http://microformats.org/profile/hcalendar#vevent',
      name: 'vEvent',
      spec: 'vevent',
      update: function($tab, $items) {
        $items.each(function(i, node) {
          var icalText = $.microdata.ical(node);
          if (i > 0)
            $tab.append(document.createElement('hr'));
          $tab.append(pre(icalText));
          $tab.append(downloadIt('text/calendar;componenet=vevent', icalText));
        });
      }
    }
  ];

  var tab = tabs[index-1];
  if (tab) {
    var $tab = $('#'+tab.id).empty();
    var $items = $(iframe.contentWindow.document).items(tab.type);
    if ($items.length > 0) {
      tab.update($tab, $items);
    } else {
      $tab.append($('<i>No <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#'+tab.spec+'">'+tab.name+'</a> items found.</i>'));
    }
  }
}

$(window).load(function() {
  var iframe = document.getElementsByTagName('iframe')[0];
  // detect parsing bugs
  $('.child', iframe.contentWindow.document).each(function(i, elm) {
    if (elm.parentNode.className != 'parent') {
      $('.warnings').append($('<p>Your browser moves <code>&lt;'+elm.tagName.toLowerCase()+'></code> elements during parsing; some examples will not work correctly!</p>'));
    }
  });
  // textarea
  var $textarea = $('textarea');
  $textarea.TextAreaResizer();
  $textarea.change(function() { update(iframe, $textarea.val()); });
  $textarea.keyup(function(ev) {
    // ignore home/end/page up/page down and left/up/down/right
    if (ev.keyCode < 33 || ev.keyCode > 40)
      update(iframe, $textarea.val());
  });
  // permalink
  if (window.location.search) {
    jQuery.each(window.location.search.substr(1).split('&'), function() {
      var nameval = this.split('=', 2);
      var name = decodeURIComponent(nameval[0]);
      var val = nameval.length == 2 ? decodeURIComponent(nameval[1]) : '';
      switch (name) {
      case 'html':
        $textarea.val(val);
        update(iframe, val);
      }
    });
  }
  // validator
  $('form.validate').submit(function() {
    // add <!doctype> and <title> if possible
    var doc = iframe.contentWindow.document;
    var prefix = '';
    if (doc.firstChild.publicId == undefined) {
      prefix += '<!doctype html>\n';
      if (doc.getElementsByTagName('title').length == 0)
        prefix += '<title></title>\n';
    }
    $('input[name=content]', this).val(prefix + $textarea.val());
  });
  // examples
  $('select').change(function(ev) {
    var source = ev.target.value;
    if (source) {
      $.get('example/'+source, function(data) {
        $textarea.val(data);
        update(iframe, data);
      });
    }
  });
  // tabs
  $(function(){
    $('#tabs').tabs({show: function(ev, ui) { updateTab(iframe, ui.index); }});
  });
});
