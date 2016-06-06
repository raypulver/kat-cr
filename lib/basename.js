var path = require('path');
module.exports = function basename (str) {
  var i = 0;
  var escape = false;
  var lastPath = '';
  while(str[i]) {
    if (escape) {
      escape = false;
      lastPath += str[i];
    } else if (str[i] === '\\') {
      escape = true;
    } else if (str[i] === path.sep) {
      lastPath = '';
    } else {
      lastPath += str[i];
    }
    ++i;
  }
  return lastPath;
}

