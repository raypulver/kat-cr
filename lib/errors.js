"use strict";

module.exports = {
  UnexpectedResponseError: UnexpectedResponseError,
  ArgParseError: ArgParseError
};

function UnexpectedResponseError(msg) {
  let retval = Error(msg);
  retval.name = UnexpectedResponseError.name;
  return retval;
}

function ArgParseError(msg) {
  let retval = Error(msg);
  retval.name = ArgParseError.name;
  return retval;
}
