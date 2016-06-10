/**
 * @module kat-cr/lib/argv
 * @description
 * Provides a pseudo constructor ArgvParser that accepts an array of options
 * and returns a function that parses command-line arguments
 */

"use strict";

const clone = require('clone'),
  ArgParseError = require('./errors').ArgParseError;

/** @namespace ArgvParser */

/**
 * @description
 * Expands short options in an argv array
 * @param {Array.<string>} argv
 * @returns {Array.<string>} The permuted argv
 * @example
 * permuteArgv(['-abc'])
 * // returns ['-a', '-b', '-c']
 */

function permuteArgv(argv) {
  let newArgs = [];
  argv.forEach(function(v) {
    if (/^-[a-zA-Z0-9]+$/.test(v)) {
      newArgs = newArgs.concat(v.split('').slice(1).map(function(v) {
        return '-' + v;
      }));
    } else newArgs.push(v);
  });
  return newArgs;
}

/** @namespace ArgvConfigItem **/

/**
 * @typedef {Object} ArgvConfigItem
 * @description
 * An object representing a possible command-line switch
 * @property {string} short The one-character short version, must be alphanumeric
 * @property {string} long The long version, must be alphanumeric but may contain hyphens
 * @property {string|null} type The type of the argument to be parsed, null for no argument
 * @property {*} defaultValue If provided, the default value of the argument
 */

/** @namespace ArgvConfig */

/**
 * @typedef {Array.<ArgvConfigItem>} ArgvConfig
 * @description
 * A regular array containing possible command line switches.
 * Has a custom implementation of indexOf
 */

let ArgvConfigProto = Object.create(Array.prototype);

/**
 * @description
 * Overridden indexOf function that determines the index of an option
 * object, where the item can be the short option or a long option
 * @param {string} item The long or short option
 * @returns {number} The index of the option, or -1 if it does exist 
 */

function indexOf(item) {
  for (let i = 0; i < this.length; ++i) {
    if ('-' + this[i].short === item || this[i].regexp.test(item)) return i;
    try {
      this[i].incorrect.forEach(function(v) {
        if (v.regexp.test(item)) throw Error();
      });
    } catch (e) {
      return i;
    }
  }
  return -1;
};

ArgvConfigProto.indexOf = indexOf;

const ArgvConfigItemProto = {

/**
 * @description
 * Tests if a long option is spelled correctly but is provided an incorrect argument
 * @param {string} opt The entire long option
 * @returns {boolean} Always true if the function does not throw
 * @throws {ArgParseError} Validation must pass
 * @memberof ArgvConfigItem
 */

  validateLongOption: function validateLongOption(opt) {
    this.incorrect.forEach(function(v) {
      if (v.regexp.test(opt)) throw ArgParseError(v.error);
    });
    return true;
  }
};

/** @namespace Parser */

/**
 * @typedef {function(Array.<string>) : Object} Parser
 * @description
 * A function that parses an array of command-line options
 * @param {Array.<string>} argv The command-line options
 * @returns {Object} Each long option in the Parser's config object will
 * appear as a property of this object, it will be set to the value of the
 * argument that was passed in or the defaultValue for that option. The array
 * of leftover arguments will be assigned to the 'remaining' property.
 */

/**
 * @description
 * Returns a function that parses an array of command line options into an object
 * @param {module:kat-cr/lib/argv~ArgvConfig} config The array of possible command line options
 * @returns {module:kat-cr/lib/argv~Parser} A function accepting an array of command line options
 */

module.exports = function ArgvParser(config) {
  validateArgvParserConfig(config);
  let cfg = clone(config);
  cfg.forEach(function(v) {
    if (v.type === 'string') {
      v.regexp = RegExp(`^--${v.long}=(?:([\"'])([^\\1\\\\]|\\\\.)*?\\1|([^\"'].*))$`);
      v.incorrect = [{
        error: `Must supply an argument to --${v.long}`,
        regexp: RegExp(`^--${v.long}$`)
      }];
    } else if (v.type === 'number') {
      v.regexp = RegExp(`^--${v.long}=(\\d+(?:\\.\\d+)?$)`)
      v.incorrect = [{
        error: `Must supply a numeric argument to --${v.long}`,
        regexp: RegExp(`^--${v.long}=.*\\..*\\..*$`)
      }, {
        error: `Must supply a numeric argument to --${v.long}`,
        regexp: RegExp(`^--${v.long}=(?:$|.*[^\\.\\d].*$)`)
      }];
    } else if (!v.type) {
      v.regexp = RegExp(`^--${v.long}`);
      v.incorrect = [{
        error: `Option --${v.long} does not take an argument`,
        regexp: RegExp(`^--${v.long}=`)
      }]
    }
    Object.setPrototypeOf(v, ArgvConfigItemProto);
  });
  Object.setPrototypeOf(cfg, ArgvConfigProto);
  return function(argv) {
    let retval = {},
      args = permuteArgv(argv.slice(2)),
      parts;
    for (let i = 0; i < args.length; ++i) {
      try {
        cfg.forEach(function(v, idx) {
          if (v.short && args[i] === '-' + v.short) {
            if (v.type && (args.length === i + 1 || ~cfg.indexOf(args[i + 1]))) throw ArgParseError(`Option -${v.short} requires an argument`);
            if (v.type === 'string') {
              retval[v.long] = args.splice(i, 2)[1];
              i -= 2;
            } else if (v.type === 'number') {
              retval[v.long] = +args.splice(i, 2)[1];
              i -= 2;
            } else {
              args.splice(i, 1);
              retval[v.long] = true;
              --i;
            }
            throw Error();
          } else if (parts = v.regexp.exec(args[i])) {
            if (v.type === 'string') retval[v.long] = parts[3]
            else if (v.type === 'number') retval[v.long] = +parts[1];
            else retval[v.long] = true;
            args.splice(i, 1);
            i--;
            throw Error();
          } else if (!v.validateLongOption(args[i])) {}
        });
      } catch (e) {
        if (e.name === ArgParseError.name) throw e;
      }
    }
    cfg.forEach(function(v) {
      if (typeof retval[v.long] === 'undefined') {
        if (typeof v.defaultValue === 'undefined') retval[v.long] = false;
        else retval[v.long] = v.defaultValue;
      }
    });
    args.forEach(function(v) {
      let parts, short;
      if (((short = /^-[a-zA-Z0-9]$/.test(v)) || (parts = /^(--[a-z\-A-Z0-9]+)/.exec(v))) && !~cfg.indexOf(v)) {
        if (short) throw ArgParseError(`Invalid option ${v}`);
        throw ArgParseError(`Invalid option ${parts[1]}`);
      }
    });
    retval.remaining = args;
    return retval;
  };
}

const validArgvConfigTypes = [
  'string',
  'number',
];

/**
 * @description
 * Validates an array that is passed to ArgvParser
 * @param {module:kat-cr/lib/argv~ArgvConfig} config An array of possible switches
 * @returns {undefined}
 * @throws {TypeError} Thrown when one of the keys of of one of the
 * configuration objects is of invalid type
 * @throws {Error} Thrown in the case of a non-type related error
 */

function validateArgvParserConfig(config) {
  if (!Array.isArray(config)) throw TypeError('Argument to ArgvParser must be an Array');
  config.forEach(function(v, i) {
    if (typeof v !== 'object') throw TypeError('Each element of parser configuration array must be an object');
    if (typeof v.long === 'undefined') throw Error(`Option object at index ${i} is missing a \'long\' property`);
    if (typeof v.long !== 'string') throw TypeError(`Option object at index ${i} \'long\' property is of type ${typeof v.long}; must be of type string`);
    if (/(?:[^a-z\-A-Z0-9]|--)/.test(v.long)) throw Error(`Option object at index ${i} \'long\' property set to \'${v.long}\', contains special characters; must be alphanumerical`);
    if (typeof v.short !== 'undefined' && v.short !== null) {
      if (typeof v.short !== 'string') throw TypeError(`Option object at index ${i} property \'short\' must be a string if provided, must not be ${typeof v.short}`);
      if (!/^[a-zA-Z0-9]$/.test(v.short)) throw Error(`Option object at index ${i} property \'short\' contains more than one character or a special character; must only be one alphanumerical character`);
    }
    if (typeof v.type !== 'undefined' && v.type !== null) {
      if (typeof v.type !== 'string') throw TypeError(`Option object at index ${i} contains a \'type\' property that is of type ${typeof v.type}; must be undefined, null, or a string`);
      if (!~validArgvConfigTypes.indexOf(v.type)) throw Error(`Option object at index ${i} contains a \'type\' property set to ${v.type}, must be ${validArgvConfigTypes[0]} or ${validArgvConfigTypes[1]}`);
    }
  });
}

/** 
 * Permute argv array short options
 * @see {module:kat-cr/lib/argv~permuteArgv}
 */
module.exports._permuteArgv = permuteArgv;
