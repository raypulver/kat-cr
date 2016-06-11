/**
 * @module kat-cr/lib/util
 * @description Contains all helper functions used by the application
 */

"use strict";

const clone = require('clone'),
  chalk = require('chalk'),
  sprintf = require('sprintf');

const nullifier = {
  open: '',
  close: ''
}

/**
 * @description
 * Explicitly disables the action of chalk, preventing color from being added
 * @returns {boolean} Returns false if chalk was already disabled
 */

module.exports.neutralizeColor = function neutralizeColor() {
  if (!neutralizeColor.cache) {
    neutralizeColor.cache = clone(chalk.styles);
    Object.keys(chalk.styles).forEach(function(v) {
      Object.assign(chalk.styles[v], nullifier);
    });
    return true;
  }
  return false;
}

/**
 * @description
 * Re-enable chalk if it was previously disabled
 * @returns {boolean} Returns false if chalk was already enabled
 */

module.exports.reenableColor = function reenableColor() {
  if (!neutralizeColor.cache) return false;
  chalk.styles = neutralizeColor.cache;
  delete neutralizeColor.cache;
  return true;
}

/**
 * @description
 * Logs an item to the console then returns it, for debugging
 * @param {*} item The argument to console.log
 * @returns {*} The same item passed
 */

module.exports.log = function log(arg) {
  console.log(arg);
  return arg;
}
