/* -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */

function update(iframe, html) {
  // update preview
  var doc = iframe.contentWindow.document;
  doc.open();
  // shrink iframe to max(150, height) (replace with <iframe seamless>?)
  $(iframe.contentWindow).load(function() {
    $(iframe).height(150);
    $(iframe).height($(doc).height());
  });
  doc.write(html);
  doc.close();
  // update permalink
  $('#permalink').attr('href', '?html='+encodeURIComponent(html));
  // update selected tab
  updateTab(iframe, $('#tabs').tabs('option', 'selected'));
}

function pre(text) {
  return $('<pre>'+text.replace(/&/g, '&amp;').replace(/</g, '&lt;')+'</pre>');
}

function downloadIt(mime, data) {
  return $('<a class="download" href="data:'+mime+';charset=UTF-8,'+encodeURI(data)+'">Download it!</a>');
}

function noItems(name, itemtype, spec) {
  return $('<i>No <a href="'+spec+'">'+name+'</a> items (items with <code>itemtype="'+itemtype+'"</code>)</i>');
}

function updateTab(iframe, index) {
  var $doc = $(iframe.contentWindow.document);
  switch (index) {
  case 1: // JSON
    var $json = $('#json').empty();
    var jsonText = $.microdata.json($doc.items(), function(o) { return JSON.stringify(o, undefined, 2); });
    $json.append(pre(jsonText));
    $json.append(downloadIt('application/json', jsonText));
    break;
  case 2: // Turtle
    var $turtle = $('#turtle').empty();
    var turtleText = $.microdata.turtle($doc.items());
    $turtle.append(pre(turtleText));
    $turtle.append(downloadIt('text/turtle', turtleText));
    break;
  case 3: // vCard
    var vcardURI = 'http://microformats.org/profile/hcard';
    var $vcard = $('#vcard').empty();
    var $vcards = $doc.items(vcardURI);
    if ($vcards.length > 0) {
      $vcards.each(function(i, node) {
        var vcardText = $.microdata.vcard(node);
        if (i > 0)
          $vcard.append(document.createElement('hr'));
        $vcard.append(pre(vcardText));
        $vcard.append(downloadIt('text/directory;profile=vCard', vcardText));
      });
    } else {
      $vcard.append(noItems('vCard', vcardURI, 'http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#vcard'));
    }
    break;
  case 4: // iCal
    var veventURI = 'http://microformats.org/profile/hcalendar#vevent';
    var $ical = $('#ical').empty();
    var icalText = $.microdata.ical($doc.items(veventURI));
    if (icalText) {
      $ical.append(pre(icalText));
      $ical.append(downloadIt('text/calendar;componenet=vevent', icalText));
    } else {
      $ical.append(noItems('vEvent', veventURI, 'http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#vevent'));
    }
    break;
  }
}

$(document).ready(function() {
  var iframe = document.getElementsByTagName('iframe')[0];
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
