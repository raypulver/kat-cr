"use strict";

const clone = require('clone'),
  chalk = require('chalk'),
  sprintf = require('sprintf');

const nullifier = {
  open: '',
  close: ''
}

function neutralizeColor() {
  if (!neutralizeColor.cache) {
    neutralizeColor.cache = clone(chalk.styles);
    Object.keys(chalk.styles).forEach(function(v) {
      Object.assign(chalk.styles[v], nullifier);
    });
    return true;
  }
  return false;
}

function reenableColor() {
  if (!neutralizeColor.cache) return false;
  chalk.styles = neutralizeColor.cache;
  delete neutralizeColor.cache;
  return true;
}

module.exports = {
  neutralizeColor: neutralizeColor,
  reenableColor: reenableColor
}
