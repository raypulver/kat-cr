#!/usr/bin/env node

"use strict";

const path = require('path'),
    sprintf = require('sprintf'),
    log = console.log,
    exit = process.exit;

(function beforeRequire() {
    process.title = path.basename(process.argv[1]);
    if (process.argv.length < 3) {
        help();
        exit(1);
    }
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] === '-v' || process.argv[i] === '--version') {
            log(require('../package').version);
            exit(0);
        }
        if (process.argv[i] === '-h' || process.argv[i] === '--help') {
            help();
            exit(0);
        }
    }

    function help() {
        log('Usage: ' + process.title + ' [-mvh] [-c CATEGORY] [-p PAGE] SEARCH');
        let fmt = '       %-15s %-25s %-30s';
        log(sprintf(fmt, '-v,', '--version', 'display version number'));
        log(sprintf(fmt, '-h,', '--help', 'display this help'));
        log(sprintf(fmt, '-m', '--magnet', 'display magnet links instead of torrent URLs'));
        log(sprintf(fmt, '-n', '--no-color', 'disable colored output'));
        //    log(sprintf(fmt, '-n', '--no-color', 'disable color explicitly'));
        log(sprintf(fmt, '-c [category],', '--category=[category]', 'specify category of torrent'));
        log(sprintf(fmt, '-p [page #],', '--page=[page #]', 'specify result page number'));
    }
})();

const kickass = require('../'),
    format = require('util').format,
    chalk = require('chalk'),
    forEachRight = require('lodash.foreachright'),
    PER_PAGE = 25,
    args = process.argv.slice(2),
    color = require('supports-color');

let page, category, search, field, sorder, magnet, debug = false;

(function permuteArgv() {
    let newArgs = [];
    process.argv.forEach(function(v) {
        if (/-[a-zA-Z]+$/.test(v)) {
            newArgs = newArgs.concat(v.split('').slice(1).map(function(v) {
                return '-' + v;
            }));
        } else newArgs.push(v);
    });
    process.argv = newArgs;
})();

(function parseArgv() {
    var catRegex = /--category=(.*$)/,
        pageRegex = /--page=(\d+)/,
        fieldRegex = /--field=(.*$)/,
        sorderRegex = /--sorder=(.*$)/;
    for (var i = 0; i < args.length; i++) {
        if (args[i] === '-c') {
            category = args.splice(i, 2)[1];
            i--;
        } else if (catRegex.test(args[i])) {
            category = args.splice(i, 1)[0].match(catRegex)[1];
            i--;
        } else if (args[i] === '-p') {
            page = +args.splice(i, 2)[1];
            i--;
        } else if (pageRegex.test(args[i])) {
            page = +args.splice(i, 1)[0].match(pageRegex)[1];
        } else if (args[i] === '-f') {
            field = args.splice(i, 2)[1];
            i--;
        } else if (fieldRegex.test(args[i])) {
            field = args.splice(i, 1)[0].match(fieldRegex)[1];
        } else if (args[i] === '-s') {
            sorder = args.splice(i, 2)[1];
        } else if (sorderRegex.test(args[i])) {
            sorder = args.splice(i, 1)[0].match(sorderRegex)[1];
        } else if (args[i] === '--magnet' || args[i] === '-m') {
            magnet = true;
            args.splice(i, 1);
        } else if (args[i] === '--no-color' || args[i] === '-n') {
            color = false;
            args.splice(i, 1);
        } else if (args[i] === '--debug' || args[i] === '-d') {
            debug = true;
            args.splice(i, 1);
        }
    }
    search = args.join(' ');
})();
if (!page) page = 1;
if (!color) neutralizeColor();
if (debug) require('request-debug')(require('request'));

function neutralizeColor() {
    Object.keys(chalk.styles).forEach(function(v) {
        chalk.styles[v].open = '';
        chalk.styles[v].close = '';
    });
}
kickass({
    search: search,
    page: page,
    category: category,
    field: field,
    sorder: sorder
}).then(function(results) {
    var total = results.total_results;
    forEachRight(results.list, function(v, i) {
        log(format('%s%s - %s%s%s', chalk.styles.cyan.open, v.category, (v.elite ? chalk.styles.magenta.open + chalk.styles.bold.open + 'ELITE ' + chalk.styles.magenta.close + chalk.styles.bold.close : '') + (v.verified ? chalk.styles.bold.open : '') + chalk.styles.yellow.open, v.title, chalk.styles.yellow.close + (v.verified ? chalk.styles.bold.close : '')));
        log(format('%s%d %sSeeders %s/ %s%d %sLeechers%s', chalk.styles.bold.open + chalk.styles.green.open, v.seeds, chalk.styles.bold.close, chalk.styles.green.close, chalk.styles.bold.open + chalk.styles.red.open, v.leechs, chalk.styles.bold.close, chalk.styles.red.close));
        log(magnet ? v.magnetLink : v.torrentLink);
        log(format('%s%s%s', chalk.styles.magenta.open, v.pubDate, chalk.styles.magenta.close));
        log();
    });
    log(format('%sDisplaying torrents %s%d %s- %s%d %sout of %s%d%s total.%s', chalk.styles.cyan.open, chalk.styles.yellow.open, PER_PAGE * (page - 1) + 1, chalk.styles.bold.close, chalk.styles.bold.open, Math.min(PER_PAGE * page, total), chalk.styles.bold.close + chalk.styles.cyan.open, chalk.styles.bold.open + chalk.styles.magenta.open, total, chalk.styles.bold.close + chalk.styles.cyan.open, chalk.styles.cyan.close));
}, function(err) {
    console.log(err.stack);
});
