function update() {
  // preview always needed to put the microdata into the document
  $('.preview').html($('textarea').val());
  // update selected tab
  updateTab($('#tabs').tabs('option', 'selected'));
}

function downloadIt($appendee, mime, data) {
  $appendee.append($('<a class="download" href="data:'+mime+','+encodeURI(data)+'">Download it!</a>'));
}

function noItems($appendee, name, itemprop, spec) {
  $appendee.append($('<i>No <a href="'+spec+'">'+name+'</a> items (items with <code>itemprop="'+itemprop+'"</code>)</i>'));
}

function updateTab(index) {
  switch (index) {
  case 1:
    var $json = $('.json').empty();
    var jsonText = getJSON(document.getItems());
    $json.append($(document.createElement('pre')).text(jsonText));
    downloadIt($json, 'application/json;encoding=utf-8', jsonText);
    break;
  case 2:
    var $turtle = $('.turtle').empty();
    var turtleText = getTurtle();
    $turtle.append($(document.createElement('pre')).text(turtleText));
    downloadIt($turtle, 'text/turtle;encoding=utf-8', turtleText);
    break;
  case 3: // vCard
    var $vcard = $('.vcard').empty();
    var hcards = document.getItems('http://microformats.org/profile/hcard');
    if (hcards.length > 0) {
      for (var i = 0; i < hcards.length; i++) {
        var vCardText = getVCard(hcards[i]);
        if (i > 0)
          $vcard.append(document.createElement('hr'));
        $vcard.append($(document.createElement('pre')).text(vCardText));
        downloadIt($vcard, 'text/directory;profile=vCard;encoding=utf-8', vCardText);
      }
    } else {
      noItems($vcard, 'vCard', 'http://microformats.org/profile/hcard',
              'http://www.whatwg.org/specs/web-apps/current-work/multipage/microdata.html#vcard');
    }
    break;
  case 4: // iCal
    var $ical = $('.ical').empty();
    var iCalText = getICal();
    if (iCalText) {
      $ical.append($(document.createElement('pre')).text(iCalText));
      downloadIt($ical, 'text/calendar;componenet=vevent;encoding=utf-8', iCalText);
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
