/**
 * @module usage
 * @description
 * Exports a function which returns a function that returns a usage string
 */

"use strict";

const color = require('supports-color'),
  util = require('./util'),
  sprintf = require('sprintf'),
  chalk = require('chalk'),
  log = console.log;

if (!color) util.neutralizeColor();

const fmt = '       %-15s %-25s %-30s';

/**
 * @typedef {Object} UsageGenerator~UsageGeneratorConfig
 * @property {string} description First line that gets output by the usage function
 * @property {ArgvParser~ArgvConfig} opts Command-line option array
 */

/**
 * @description
 * Returns a function that outputs a colored usage statement based on the
 * same parameters that you would pass to ArgvParser, with an optional
 * description property
 * @param {UsageGenerator~UsageGeneratorConfig} config Configuration object
 * @returns {function(void) : void} Function that outputs the usage string to the console
 */

function UsageGenerator(config) {
  return function () {
    log(chalk.bold(chalk.yellow(config.description)));
    config.opts.forEach(function (v) {
      let specifier = (v.type === 'string' ? '[' + v.long + ']' : '') + (v.type === 'number' ? '[' + v.long + ' #]' : '');
      log(chalk.bold(chalk.gray(sprintf(fmt, '-' + v.short + (specifier ? ' ' + specifier : specifier) + ',', '--' + v.long + (specifier ? '=' + specifier : specifier), v.description))));
    });
  };
};

module.exports = UsageGenerator;
