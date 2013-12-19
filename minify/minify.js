var fs = require('fs');
var path = require('path');
var filename = process.argv[2];
var license = '// Copyright 2012-2014 (c) Peter Širka <petersirka@gmail.com>\n\n';
fs.writeFileSync(filename, license + fs.readFileSync(filename, 'utf8'), 'utf8');