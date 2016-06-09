"use strict";

const color = require('supports-color'),
  util = require('./util'),
  sprintf = require('sprintf'),
  chalk = require('chalk'),
  log = console.log;

if (!color) util.neutralizeColor();

const fmt = '       %-15s %-25s %-30s';

module.exports = function UsageGenerator(config) {
  return function () {
    log(chalk.bold(chalk.yellow(config.description)));
    config.opts.forEach(function (v) {
      let specifier = (v.type === 'string' ? '[' + v.long + ']' : '') + (v.type === 'number' ? '[' + v.long + ' #]' : '');
      log(chalk.bold(chalk.gray(sprintf(fmt, '-' + v.short + (specifier ? ' ' + specifier : specifier) + ',', '--' + v.long + (specifier ? '=' + specifier : specifier), v.description))));
    });
  };
};

