"use strict";

const sprintf = require('sprintf'),
  clone = require('clone'),
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
        if (v.regexp.test(item)) throw Error('catch me');
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
      v.regexp = RegExp(sprintf("^--%s=(?:([\"'])([^\\1\\\\]|\\\\.)*?\\1|([^\"'].*))$", v.long));
      v.incorrect = [{
        error: sprintf('Must supply an argument to --%s', v.long),
        regexp: RegExp(sprintf("^--%s$", v.long))
      }];
    } else if (v.type === 'number') {
      v.regexp = RegExp(sprintf("^--%s=(\\d+(?:\\.\\d+)?$)", v.long))
      v.incorrect = [{
        error: sprintf('Must supply a numeric argument to --%s', v.long),
        regexp: RegExp(sprintf("^--%s=.*\\..*\\..*$", v.long))
      }, {
        error: sprintf('Must supply a numeric argument to --%s', v.long),
        regexp: RegExp(sprintf("^--%s=(?:$|.*[^\\.\\d].*$)", v.long))
      }];
    } else if (!v.type) {
      v.regexp = RegExp(sprintf("^--%s", v.long));
      v.incorrect = [{
        error: 'Option --%s does not take an argument',
        regexp: RegExp(sprintf("^--%s=", v.long))
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
            if (v.type && (args.length === i + 1 || ~cfg.indexOf(args[i + 1]))) throw ArgParseError(sprintf('Option -%s requires an argument', v.short));
            if (v.type === 'string') {
              retval[v.long] = args.splice(i, 2)[1];
              i -= 2;
            } else if (v.type === 'number') {
              retval[v.long] = +args.splice(i, 2)[1];
              i -= 2;
            } else retval[v.long] = true;
            throw Error('catch me');
          } else if (parts = v.regexp.exec(args[i])) {
            if (v.type === 'string') retval[v.long] = parts[3]
            else if (v.type === 'number') retval[v.long] = +parts[1];
            else retval[v.long] = true;
            args.splice(i, 1);
            i--;
            throw Error('catch me');
          } else if (!v.validateLongOption(args[i])) {}
        });
      } catch (e) {
        if (e.name === ArgParseError.name) throw e;
      }
    }
    args.forEach(function(v) {
      if (/^-[a-zA-Z0-9]$/.test(v) && !~cfg.indexOf(v)) throw ArgParseError(sprintf('Invalid option %s', args[i]));
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
    if (typeof v.long === 'undefined') throw Error(sprintf('Option object at index %d is missing a \'long\' property', i));
    if (typeof v.long !== 'string') throw TypeError(sprintf('Option object at index %d \'long\' property is of type %s; must be of type string', i, typeof v.long));
    if (/(?:[^a-z\-A-Z0-9]|--)/.test(v.long)) throw Error(sprintf('Option object at index %d \'long\' property set to \'%s\', contains special characters; must be alphanumerical', i, v.long));
    if (typeof v.short !== 'undefined' && v.short !== null) {
      if (typeof v.short !== 'string') throw TypeError(sprintf('Option object at index %d property \'short\' must be a string if provided, must not be %s', i, typeof v.short));
      if (!/^[a-zA-Z0-9]$/.test(v.short)) throw Error(sprintf('Option object at index %d property \'short\' contains more than one character or a special character; must only be one alphanumerical character', i));
    }
    if (typeof v.type !== 'undefined' && v.type !== null) {
      if (typeof v.type !== 'string') throw TypeError(sprintf('Option object at index %d contains a \'type\' property that is of type %s; must be undefined, null, or a string', i, typeof v.type));
      if (!~validArgvConfigTypes.indexOf(v.type)) throw Error(sprintf('Option object at index %d contains a \'type\' property set to %s, must be %s or %s', i, v.type, validArgvConfigTypes[0], validArgvConfigTypes[1]));
    }
  });
}

ArgvParser._permuteArgv = permuteArgv;
module.exports = ArgvParser;
