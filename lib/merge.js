module.exports = function merge() {
  return [].map.call(arguments, function (v) {
    if (/\/$/.test(v)) return v.substr(0, v.length - 1);
    return v;
  }).join('/');
}
