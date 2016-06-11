/**
 * @module kat-cr/lib/errors
 * @description Custom error classes used by the library
 */

"use strict";

/** @namespace UnexpectedResponseError */

/**
 * @typedef {Error} UnexpectedResponseError
 * @property {string} name Always 'UnexpectedResponseError'
 * @property {string} message Error message
 * @property {string} stack Call stack
 * @see {module:kat-cr/lib/selector}
 */

/**
 * @description
 * Construct an Error with a custom name, used to represent when
 * Kickass Torrents responds with a page that the library does
 * not know how to handle properly
 * @param {string} msg Error message
 * @constructs UnexpectedResponseError
 */

module.exports.UnexpectedResponseError = function UnexpectedResponseError(msg) {
  let retval = Error(msg);
  retval.name = UnexpectedResponseError.name;
  return retval;
}

/** @namespace ArgParseError */

/**
 * @typedef {Error} ArgParseError
 * @property {string} name Always 'ArgParseError'
 * @property {string} message Error message
 * @property {string} stack Call stack
 * @see {module:kat-cr/lib/argv}
 */

/**
 * @description
 * Construct an Error with a custom name, used to represent when an error
 * occured parsing the arguments array
 * @param {string} msg Error message
 * @constructs ArgParseError
 */

module.exports.ArgParseError = function ArgParseError(msg) {
  let retval = Error(msg);
  retval.name = ArgParseError.name;
  return retval;
}

