module.exports = function forEachRight (arr, cb, thisArg) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (cb.apply(thisArg, [ arr[i], i, arr ]) === false) {
      break;
    }
  }
}
