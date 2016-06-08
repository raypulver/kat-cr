"use strict";

module.exports = {
  UnexpectedResponseError: UnexpectedResponseError
};

function UnexpectedResponseError(msg) {
  let retval = Error(msg);
  retval.name = UnexpectedResponseError.name;
}
