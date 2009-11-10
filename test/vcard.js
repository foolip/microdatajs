module('vCard');

test('escape the vCard text string', function() {
    equals(escapeString(''), '', 'empty string');
    equals(escapeString('ABC'), 'ABC', 'ABC');
    equals(escapeString('\\'), '\\\\', 'escape \\');
    equals(escapeString(','), '\\,', 'escape ,');
    equals(escapeString(';'), '\\;', 'escape ;');
    equals(escapeString('\r\n'), '\\n', 'escape CRLF');
    equals(escapeString('\r'), '\\n', 'escape CR');
    equals(escapeString('\n'), '\\n', 'escape LF');
    equals(escapeString('A\r\nB\rC\nD\n\r'), 'A\\nB\\nC\\nD\\n\\n', 'escape mixed CRLF+CR+LF');
    var orig = 'A;B';
    var escaped = escapeString(orig);
    ok(orig == 'A;B' && escaped == 'A\\;B', 'doesn\'t modify input');
});

function testValid(fn, args) {
    for (var i=0; i<args.length; i++)
	ok(fn(args[i]), 'valid: '+args[i]);
}

function testInvalid(fn, args) {
    for (var i=0; i<args.length; i++)
	ok(!fn(args[i]), 'invalid: '+args[i]);
}

test('valid time string',
function() {
    testValid(isValidTimeString,
	      ['00:00', '23:59', '00:00:00', '23:59:59']);
    testInvalid(isValidTimeString,
		['', '00', '00:', '24:00', '00:60', '24:00:00',
		 '00:60:00', '00:00:60', 'HH:MM:SS', 'foo']);
});

test('valid date string',
function() {
    testValid(isValidDateString,
	      ['0001-01-01', '2009-11-12', '20000-01-01', '2009-01-31',
	       '2009-02-28', '2009-03-31', '2009-04-30', '2009-05-31',
	       '2009-06-30', '2009-07-31', '2009-08-31', '2009-09-30',
	       '2009-10-31', '2009-11-30', '2009-12-31', '2008-02-29',
	       '2000-02-29']);
    testInvalid(isValidDateString,
		['', '0', '0000-00', '0000-00-00', '0001-01-00', '0001-00-01',
		 '0000-01-01', '2009-01-32', '2009-02-29', '2009-03-32',
		 '2009-04-31', '2009-05-32', '2009-06-31', '2009-07-32',
		 '2009-08-32', '2009-09-31', '2009-10-32', '2009-11-31',
		 '2009-12-32', '1900-02-29', 'YYYY-MM-DD', 'foo']);
});

test('valid global date and time string',
function() {
    testValid(isValidGlobalDateAndTimeString,
	      ['0037-12-13T00:00Z', '1979-10-14T12:00:00.001-04:00',
	       '8592-01-01T02:09+02:09']);
    testInvalid(isValidGlobalDateAndTimeString,
		['', '2009-11-10', '2009-11-10t15:34+01:00',
		 '2009-11-10T15:34', '2009-11-10T15:34z']);
});
