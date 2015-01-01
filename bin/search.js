#!/usr/bin/env node

(function beforeRequire () {
  var log = console.log,
      exit = process.exit;
  process.title = process.argv[1];
  if (process.argv.length < 3) {
    help();
    exit(0);
  }
  for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '-v' || process.argv[i] === '--version') {
      log(require('../package').version);
      exit(0);
    }
    if (process.argv[i] === '-h' || process.argv[i] === '--help') {
      help();
      exit(0);
    }
  }
  function help () {
    log('usage: kickass [options] search');
    log('searches for torrents on kickass.so, options are:');
    log('  -v, --version\tdisplay version number');
    log('  -h, --help\tdisplay this help');
    log('  -c [category], --category=[category]\tspecify category of torrent');
    log('  -p [page #], --page=[page #]\tspecify result page number');
  }
})();

var kickass = require('../'),
    format = require('util').format,
    forEachRight = require('../lib/foreach-right'),
    log = console.log,
    PER_PAGE = 25,
    args = process.argv.slice(2),
    page, category, search, field, sorder;

(function parseArgs () {
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
    }
  }
  search = args.join(' ');
})();
if (!page) page = 1;
kickass({
  search: search,
  page: page,
  category: category,
  field: field,
  sorder: sorder
}, function (err, results) {
  if (err) return console.log(err);
  var total = results.total_results;
  forEachRight(results.list, function (v) {
    log(format('\033[36m%s - \033[1;33m%s\033[22;39m', v.category, v.title));
    log(format('\033[1;32m%d \033[22mSeeders \033[39m/ \033[1;31m%d \033[22mLeechers\033[39m', v.seeds, v.leechs));
    log(v.torrentLink);
    log(format('\033[35m%s\033[39m', v.pubDate));
    log();
  });
  log(format('\033[36mDisplaying torrents \033[1;33m%d \033[22m- \033[1m%d \033[22;36mout of \033[1;35m%d\033[22;36m total.\033[39m', PER_PAGE*(page - 1) + 1, Math.min(PER_PAGE*page, total), total));
});
