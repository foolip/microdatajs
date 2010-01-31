/* -*- mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil -*- */

function update() {
  // preview always needed to put the microdata into the document
  $('#preview').html($('textarea').val());
  // update selected tab
  updateTab($('#tabs').tabs('option', 'selected'));
}

function pre(text) {
  return $('<pre>'+text.replace(/&/g, '&amp;').replace(/</g, '&lt;')+'</pre>');
}

function downloadIt($appendee, mime, data) {
  $appendee.append($('<a class="download" href="data:'+mime+','+encodeURI(data)+'">Download it!</a>'));
}

function noItems($appendee, name, itemtype, spec) {
  $appendee.append($('<i>No <a href="'+spec+'">'+name+'</a> items (items with <code>itemtype="'+itemtype+'"</code>)</i>'));
}

function updateTab(index) {
  switch (index) {
  case 1:
    var $json = $('#json').empty();
    var jsonText = $.microdata.json();
    $json.append(pre(jsonText));
    downloadIt($json, 'application/json;encoding=utf-8', jsonText);
    break;
  case 2:
    var $turtle = $('#turtle').empty();
    var turtleText = $.microdata.turtle();
    $turtle.append(pre(turtleText));
    downloadIt($turtle, 'text/turtle;encoding=utf-8', turtleText);
    break;
  case 3:
    var $vcard = $('#vcard').empty();
    var $vcards = $(document).items('http://microformats.org/profile/hcard');
    if ($vcards.length > 0) {
      $vcards.each(function(i, node) {
        var vcardText = $.microdata.vcard(node);
        if (i > 0)
          $vcard.append(document.createElement('hr'));
        $vcard.append(pre(vcardText));
        downloadIt($vcard, 'text/directory;profile=vCard;encoding=utf-8', vcardText);
      });
    } else {
      noItems($vcard, 'vCard', 'http://microformats.org/profile/hcard',
              'http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#vcard');
    }
    break;
  case 4: // iCal
    var $ical = $('#ical').empty();
    var icalText = $.microdata.ical();
    if (icalText) {
      $ical.append(pre(icalText));
      downloadIt($ical, 'text/calendar;componenet=vevent;encoding=utf-8', icalText);
    } else {
      noItems($ical, 'vEvent', 'http://microformats.org/profile/hcalendar#vevent',
              'http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#vevent');
    }
    break;
  }
}
$(function(){
  $('#tabs').tabs({show: function(ev, ui) { updateTab(ui.index); }});
});
$(document).ready(function() {
  var $textarea = $('textarea');
  $textarea.TextAreaResizer();
  $textarea.change(update);
  $textarea.keyup(function(ev) {
    // ignore home/end/page up/page down and left/up/down/right
    if (ev.keyCode < 33 || ev.keyCode > 40)
      update();
  });
  $('select').change(function(ev) {
    var source = ev.target.value;
    if (source) {
      $.get('example/'+source, function(data) {
        $textarea.val(data);
        update();
      });
    }
  });
});
