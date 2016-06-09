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
  description: 'specify page number of results'
}, {
  type: 'string',
  short: 'f',
  long: 'field',
  description: 'specify field to order results by'
}, {
  type: 'string',
  short: 's',
  long: 'sorder',
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
  description: 'Usage: ' + process.title + ' [-mnvh] [-c CATEGORY] [-p PAGE] [-f FIELD] [-s SORTORDER] SEARCH',
  opts: opts
});

try {
  var args = argParser(process.argv);
} catch (e) {
  log(sprintf('%s: %s', process.title, e.message));
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
if (!args.page) args.page = 1;
if (args['no-color'] || !color) util.neutralizeColor();
if (args.debug) {
  log(args);
  require('request-debug')(require('request'));
}
if (!args.remaining.length) {
  log(sprintf('%s: %s', process.title, 'Must supply a search query'));
  help();
  exit(1);
}
kickass({
  search: args.remaining.join(' '),
  page: args.page,
  category: args.category,
  field: args.field,
  sorder: args.sorder
}).then(function(results) {
  var total = results.total_results;
  forEachRight(results.list, function(v, i) {
    log(format('%s%s - %s%s%s', chalk.styles.cyan.open, v.category, (v.elite ? chalk.styles.magenta.open + chalk.styles.bold.open + 'ELITE ' + chalk.styles.magenta.close + chalk.styles.bold.close : '') + (v.verified ? chalk.styles.bold.open : '') + chalk.styles.yellow.open, v.title, chalk.styles.yellow.close + (v.verified ? chalk.styles.bold.close : '')));
    log(format('%s%d %sSeeders %s/ %s%d %sLeechers%s', chalk.styles.bold.open + chalk.styles.green.open, v.seeds, chalk.styles.bold.close, chalk.styles.green.close, chalk.styles.bold.open + chalk.styles.red.open, v.leechs, chalk.styles.bold.close, chalk.styles.red.close));
    log(args.magnet ? v.magnetLink : v.torrentLink);
    log(format('%s%s%s', chalk.styles.magenta.open, v.pubDate, chalk.styles.magenta.close));
    log();
  });
  log(format('%sDisplaying torrents %s%d %s- %s%d %sout of %s%d%s total.%s', chalk.styles.cyan.open, chalk.styles.yellow.open, PER_PAGE * (args.page - 1) + 1, chalk.styles.bold.close, chalk.styles.bold.open, Math.min(PER_PAGE * args.page, total), chalk.styles.bold.close + chalk.styles.cyan.open, chalk.styles.bold.open + chalk.styles.magenta.open, total, chalk.styles.bold.close + chalk.styles.cyan.open, chalk.styles.cyan.close));
}, function(err) {
  console.log(err.stack);
});
