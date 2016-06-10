#!/usr/bin/env node

"use strict";

const path = require('path'),
  sprintf = require('sprintf'),
  color = require('supports-color'),
  kickass = require('../'),
  format = require('util').format,
  chalk = require('chalk'),
  ArgvParser = require('../lib/argv'),
  UsageGenerator = require('../lib/usage'),
  util = require('../lib/util'),
  forEachRight = require('lodash.foreachright'),
  log = console.log,
  exit = process.exit,
  PER_PAGE = 25;

process.title = path.basename(process.argv[1]);

const opts = [{
  type: 'string',
  short: 'c',
  long: 'category',
  description: 'specify torrent category'
}, {
  type: 'number',
  short: 'p',
  long: 'page',
  defaultValue: 1,
  description: 'specify page number of results'
}, {
  type: 'string',
  short: 'f',
  long: 'field',
  defaultValue: 'seeders',
  description: 'specify field to order results by'
}, {
  type: 'string',
  short: 's',
  long: 'sorder',
  defaultValue: 'desc',
  description: 'specify sort order (asc or desc)'
}, {
  type: null,
  short: 'm',
  long: 'magnet',
  description: 'output magnet links instead'
}, {
  type: null,
  short: 'd',
  long: 'debug',
  description: 'enable debug output'
}, {
  type: null,
  short: 'h',
  long: 'help',
  description: 'display this help and exit'
}, {
  type: null,
  short: 'n',
  long: 'no-color',
  description: 'disable colored output'
}, {
  type: null,
  short: 'v',
  long: 'version',
  description: 'display version number and exit'
}];

const argParser = ArgvParser(opts);

const help = UsageGenerator({
  description: `Usage: ${process.title} [-mnvh] [-c CATEGORY] [-p PAGE] [-f FIELD] [-s SORTORDER] SEARCH`,
  opts
});

try {
  var args = argParser(process.argv);
} catch (e) {
  log(`${process.title}: ${e.message}`);
  help();
  exit(1);
}
if (args.help) {
  help();
  exit(0);
}
if (args.version) {
  log(require('../package').version);
  exit(0);
}
if (!args.page) args = Object.assign({
  page: 1
}, args);
if (args['no-color'] || !color) util.neutralizeColor();
if (args.debug) {
  log(args);
  require('request-debug')(require('request'));
}
if (!args.remaining.length) {
  log(`${process.title}: Must supply a search query`);
  help();
  exit(1);
}

function maybeEliteTag(isElite) {
  if (isElite) return chalk.magenta(chalk.bold('ELITE '));
  return '';
}

function maybeBold(msg, isVerified) {
  if (isVerified) return chalk.bold(msg);
  return msg;
}

kickass({
  search: args.remaining.join(' '),
  page: args.page,
  category: args.category,
  field: args.field,
  sorder: args.sorder
}).then(function(results) {
  forEachRight(results.list, function(v, i) {
    log(`${chalk.cyan(v.category)} ${chalk.cyan('-')} ${maybeEliteTag(v.elite)}${chalk.yellow(maybeBold(v.title, v.verified))}`);
    log(`${chalk.green(chalk.bold(v.seeds))} ${chalk.green('Seeders')} / ${chalk.red(chalk.bold(v.leechs))} ${chalk.red('Leechers')}`);
    log(args.magnet ? v.magnetLink : v.torrentLink);
    log(chalk.magenta(v.pubDate));
    log();
  });
  log(`${chalk.cyan('Displaying torrents')} ${chalk.bold(chalk.yellow(String(PER_PAGE * (args.page - 1) + 1) + ' - ' + String(Math.min(PER_PAGE * args.page, results.total_results))))} ${chalk.cyan('out of')} ${chalk.bold(chalk.magenta(String(results.total_results)))} ${chalk.cyan('total')}`);
}, function(err) {
  log(`${process.title}: ${err.message}`);
});
