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
args = Object.assign({ page: 1 }, args);
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
kickass({
  search: args.remaining.join(' '),
  page,
  category,
  field,
  sorder
} = args).then(function(results) {
  let total = results.total_results,
      { cyan, green, red, yellow, magenta, bold } = chalk.styles;
  forEachRight(results.list, function(v, i) {
    let elitePrefix = `${magenta.open}${bold.open}ELITE ${magenta.open}${bold.open}`;
    let prefix = `${v.elite ? elitePrefix : ''}${v.verified ? bold.open : ''}${yellow.open}`,
    log(`${cyan.open}${v.category}${cyan.close} - ${prefix}${v.title}${yellow.close}${v.verified ? bold.close : ''}`);
    log(`${green.open}${bold.open}${v.seeds}${bold.close} Seeders${green.close} / ${red.open}${bold.open}${v.leechs}${bold.close} Leechers${red.close}`);
    log(args.magnet ? v.magnetLink : v.torrentLink);
    log(`${magenta.open}${v.pubDate}${magenta.close}`);
    log();
  });
  log(`${yellow.open}${cyan.open}Displaying torrents${cyan.close} ${PER_PAGE * (args.page - 1) + 1} - ${bold.open}${Math.min(PER_PAGE * args.page, total)}${bold.close} ${cyan.open}out of${cyan.close} ${bold.open}${magenta.open}${total}{magenta.close}{bold.close} {cyan.open}total.${cyan.close}`);
}, function(err) {
  console.log(err.stack);
});
