/**
 * @module kat-cr/lib/fetch
 * @description
 * Wraps request in a Promise
 */

/**
 * The HTTP response class provided by request
 * @external HTTPResponse
 * @see {@link http://github.com/request/request}
 */

"use strict";

const request = (function loadPrivate(module) {
  let modulePath = require.resolve(module),
      cached = require.cache[modulePath];
  delete require.cache[modulePath];
  let retval = require(module);
  require.cache[modulePath] = cached;
  return retval;
})('request'),
  USER_AGENTS = require('../config/user-agents');


// Not necessary as of now, but in case Kickass Torrents requires cookies enabled in the future, and in case the library user needs to use request with his or her own cookie jar, we load a private copy of request so we can use our own cookie jar instead of overriding the global one
  
request.defaults({
  jar: true
});

/**
 * @description
 * Wraps request in a Promise, also sets a random user agent
 * @param {Object} config The details of the request as if it were passed to request directly
 * @returns {Promise.<external:HTTPResponse>} A promise which resolves with the response, or rejects with an error
 * @example
 * // Make a request to a JSON API
 * require('kat-cr/lib/fetch')({
 *   method: 'GET',
 *   url: 'http://server.com/json-endpoint',
 * }).then(function (response) {
 *   JSON.parse(response.body);
 * });
 */

module.exports = function fetch(config) {
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  config.headers['user-agent'] = USER_AGENTS[Math.floor(Math.random()*USER_AGENTS.length)];
  return new Promise(function (resolve, reject) {
    request(config, function (err, resp, body) {
      if (err) reject(err);
      resolve(resp);
    });
  });
};

/** Expose private request module for debugging */
module.exports._request = request;
