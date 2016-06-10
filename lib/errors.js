/*
 * @module errors
 * @description Custom error classes used by the library
 */

"use strict";

module.exports = {
  UnexpectedResponseError: UnexpectedResponseError,
  ArgParseError: ArgParseError
};

/* @namespace UnexpectedResponseError */

/**
 * @typedef {Error} UnexpectedResponseError
 * @property {string} name Always 'UnexpectedResponseError'
 * @property {string} message Error message
 * @property {string} stack Call stack
 */

/**
 * @description
 * Construct an Error with a custom name, used to represent when
 * Kickass Torrents responds with a page that the library does
 * not know how to handle properly
 * @param {string} msg Error message
 * @constructs UnexpectedResponseError
 */

function UnexpectedResponseError(msg) {
  let retval = Error(msg);
  retval.name = UnexpectedResponseError.name;
  return retval;
}

/* @namespace ArgParseError */

/**
 * @typedef {Error} ArgParseError
 * @property {string} name Always 'ArgParseError'
 * @property {string} message Error message
 * @property {string} stack Call stack
 */

/**
 * @description
 * Construct an Error with a custom name, used to represent when an error
 * occured parsing the arguments array
 * @param {string} msg Error message
 * @constructs ArgParseError
 */

function ArgParseError(msg) {
  let retval = Error(msg);
  retval.name = ArgParseError.name;
  return retval;
}
