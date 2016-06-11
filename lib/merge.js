/**
 * @module kat-cr/lib/merge
 * @description
 * Simple function to combine URI segments
 */

"use strict";

const uriRe = /(.*)\/$/;

/**
 * @description
 * Merges http URI segments together
 * @param {...string} arguments - Each URI segment
 * @returns {string} Complete URI
 * @example
 * require('kat-cr/lib/merge')(['http://', 'www.google.com', 'endpoint']);
 * // 'http://www.google.com/endpoint'
 *
 */

module.exports = function merge() {
  return [].map.call(arguments, function (v) {
    let parts = uriRe.exec(v);
    return parts ? parts[1]: v;
  }).join('/');
}
