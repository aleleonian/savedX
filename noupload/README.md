1. Remove the node-gyp Symlink

rm node_modules/sqlite3/node_modules/.bin/node-gyp
cp node_modules/sqlite3/node_modules/node-gyp/bin/node-gyp.js node_modules/sqlite3/node_modules/.bin/node-gyp

rm node_modules/sqlite3/node_modules/.bin/nopt
cp node_modules/sqlite3/node_modules/nopt/bin/nopt.js node_modules/sqlite3/node_modules/.bin/nopt

find node_modules/sqlite3 -type l

/////

Quarantine thingy for macos binaries:
xattr -rd com.apple.quarantine /path/to/binary
