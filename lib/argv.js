"use strict";

const clone = require('clone'),
  ArgParseError = require('./errors').ArgParseError;

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

let ArgvConfigProto = Object.create(Array.prototype);

ArgvConfigProto.indexOf = function indexOf(item) {
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

const ArgvConfigItemProto = {
  validateLongOption: function validateLongOption(opt) {
    this.incorrect.forEach(function(v) {
      if (v.regexp.test(opt)) throw ArgParseError(v.error);
    });
    return true;
  }
};


function ArgvParser(config) {
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
    cfg.forEach(function (v) {
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

ArgvParser._permuteArgv = permuteArgv;
module.exports = ArgvParser;
