#!/usr/bin/env node

"use strict";

const path = require('path'),
  hasColor = require('supports-color'),
  kickass = require('../'),
  chalk = require('chalk'),
  ArgvParser = require('../lib/argv'),
  UsageGenerator = require('../lib/usage'),
  util = require('../lib/util'),
  forEachRight = require('lodash.foreachright'),
  log = console.log,
  exit = process.exit,
  PER_PAGE = 25;

process.title = path.basename(process.argv[1]);

const opts = require('../config/opts'),
  argParser = ArgvParser(opts);

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
if (args['no-color'] || !hasColor) util.neutralizeColor();
if (args.debug) {
  log(args);
  require('request-debug')(require('../lib/fetch')._request);
}
if (args.help) {
  help();
  exit(0);
}
if (args.version) {
  log(require('../package').version);
  exit(0);
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
  log(`${process.title}: ${args.debug ? err.stack : err.message}`);
});
