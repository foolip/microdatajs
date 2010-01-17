// http://www.whatwg.org/specs/web-apps/current-work/multipage/converting-html-to-other-formats.html#rdf
function getRDF() {
    function URI(uri) {
	this.uri = uri;
    }
    URI.prototype.equals = function(other) {
	return other instanceof URI && this.uri == other.uri;
    };
    URI.prototype.toTurtle = function(prefixes) {
	for (var i=0; prefixes && i<prefixes.length; i++) {
	    var p = prefixes[i];
	    if (this.uri.substr(0, p.uri.length) == p.uri) {
		p.used = true;
		return p.name+':'+this.uri.substr(p.uri.length);
	    }
	}
	return '<'+this.uri+'>';
    };
    function Literal(string, lang) {
	this.string = string;
	this.lang = lang;
    }
    Literal.prototype.toTurtle = function() {
	return '"'+this.string.replace(/([\\"])/g, '\\$1').replace(/\r/g, '\\r').replace(/\n/g, '\\n')+'"'+
	    (this.lang ? ('@'+this.lang) : '');
    };
    function Blank() {
	this.id = Blank.prototype.ids++;
    }
    Blank.prototype.ids = 0;
    Blank.prototype.equals = function(other) {
	return other instanceof Blank && this.id == other.id;
    };
    Blank.prototype.toTurtle = function() {
	return '_:n'+this.id;
    };

    function Triple(s, p, o) {
	this.s = s;
	this.p = p;
	this.o = o;
    }
    Triple.prototype.toTurtle = function() {
	return this.s.toTurtle() + ' ' + this.p.toTurtle() + ' ' + this.o.toTurtle() + ' .\n';
    };

    function isAbsoluteURL(url) {
	// FIXME: not really!
	return url.substr(0, 7) == 'http://';
    }

    function getLang(elem) {
	// FIXME: the spec isn't 100% clear about how to get the language
	/*
	var lang;
	for (var walk = prop; walk; walk = walk.parentNode) {
	    if (walk.lang) {
		lang = walk.lang;
		break;
	    }
	}
	return lang;
	 */
	return elem.lang;
    }

    var triples = [];

    var title = document.getElementsByTagName('title')[0];
    if (title)
	triples.push(new Triple(new URI(document.location.href),
				new URI('http://purl.org/dc/terms/title'),
				new Literal(title.textContent, getLang(title))));
    // FIXME: a, area, link
/*
    var links = document.querySelectorAll('a,area,link');
    for (var linkIndex=0; linkIndex<links.length; linkIndex++) {
	var elm = links[linkIndex];
	if (!elm.hasAttribute('rel') || !elm.hasAttribute('href'))
	    continue;
	var tokens = splitTokens(elm.getAttribute('rel'));
    }
*/

    var metas = document.getElementsByTagName('meta');
    for (var metaIndex = 0; metaIndex < metas.length; metaIndex++) {
	var meta = metas[metaIndex];
	if (meta.hasAttribute('name') && meta.hasAttribute('content')) {
	    var subject = new URI(document.location.href);
	    var object = new Literal(meta.content, getLang(meta));
	    if (meta.name.indexOf(':') == -1)
		triples.push(new Triple(subject,
					new URI('http://www.w3.org/1999/xhtml/vocab#'+encodeURIComponent(meta.name.toLowerCase())),
					object));
	    else if (isAbsoluteURL(meta.name))
		triples.push(new Triple(subject, new URI(meta.name), object));
	}
    }

    // FIXME: blockquote, q

    function generateItemTriples(item, type) {
	var subject = isAbsoluteURL(item.itemId) ? new URI(item.itemId) : new Blank();
	if (isAbsoluteURL(item.itemType)) {
	    triples.push(new Triple(subject,
				    new URI('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
				    new URI(item.itemType)));
	    type = item.itemType;
	}
	for (var propIndex=0; propIndex<item.properties.length; propIndex++) {
	    var prop = item.properties[propIndex];
	    var value;
	    if (prop.itemScope) {
		// FIXME: the spec doesn't pass on type to subitems like this
		value = generateItemTriples(prop, type);
	    } else if (/^A|AREA|AUDIO|EMBED|IFRAME|IMG|LINK|OBJECT|SOURCE|VIDEO$/.test(prop.tagName.toUpperCase())) {
		value = new URI(prop.itemValue);
	    } else {
		value = new Literal(prop.itemValue, getLang(prop));
	    }
	    for (var nameIndex=0; nameIndex<prop.itemProp.length; nameIndex++) {
		var name = prop.itemProp[nameIndex];
		if (isAbsoluteURL(name)) {
		    triples.push(new Triple(subject, new URI(name), value));
		} else if (name.indexOf(':') == -1 && type) {
		    var predicate = type;
		    if (predicate.indexOf('#') == -1)
			predicate += '#';
		    predicate += ':';
		    predicate += encodeURIComponent(name);
		    predicate = 'http://www.w3.org/1999/xhtml/microdata#'+encodeURIComponent(predicate);
		    triples.push(new Triple(subject, new URI(predicate), value));
		}
	    }
	}
	return subject;
    }
    var items = document.getItems();
    for (var i=0; i<items.length; i++) {
	var t = new Triple(new URI(document.location.href),
			   new URI('http://www.w3.org/1999/xhtml/microdata#item'),
			   generateItemTriples(items[i]));
	triples.push(t);
    }
    return triples;
}

var prefixMap = {'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
		 'xhv': 'http://www.w3.org/1999/xhtml/vocab#',
		 'dc': 'http://purl.org/dc/terms/',
		 'hcard': 'http://www.w3.org/1999/xhtml/microdata#http%3A%2F%2Fmicroformats.org%2Fprofile%2Fhcard%23%3A',
		 'vevent': 'http://www.w3.org/1999/xhtml/microdata#http%3A%2F%2Fmicroformats.org%2Fprofile%2Fhcalendar%23vevent%3A'};

function getTurtle(pretty) {
    if (arguments.length < 1)
	pretty = true;

    var triples = getRDF();

    if (pretty) {
	var prefixes = [];
	for (prefix in prefixMap)
	    prefixes.push({'name': prefix, 'uri': prefixMap[prefix]});

	var body = '';
	while (triples.length) {
	    var rest = [];
	    var subject = null;
	    var indent = '';
	    triples.forEach(function (t) {
		if (subject == null) {
		    var subjstr = t.s.toTurtle()+' ';
		    body += subjstr+t.p.toTurtle(prefixes)+' '+t.o.toTurtle();
		    var indentlen = subjstr.length;
		    if (indentlen > 8)
			indent = '\t';
		    else
			while (indentlen-- > 0)
			    indent += ' ';
		    subject = t.s;
		} else {
		    if (subject.equals(t.s)) {
			body += ' ;\n'+indent+t.p.toTurtle(prefixes)+' '+t.o.toTurtle();
		    } else {
			rest.push(t);
		    }
		}
	    });
	    body += ' .\n';
	    triples = rest;
	}

	var head = '';
	prefixes.forEach(function(p) {
	    if (p.used)
		head += '@prefix '+p.name+': <'+p.uri+'> .\n';
	});
	return head+'\n'+body;
    } else {
	var body = '';
	triples.forEach(function (t) {
	    body += t.s.toTurtle()+' '+t.p.toTurtle()+' '+t.o.toTurtle()+' .\n';
	});
	return body;
    }
}
