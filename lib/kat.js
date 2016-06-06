#!/usr/bin/env node
var re = require('request'),
    cheerio = require('cheerio'),
    API_URL = 'http://kat.cr/json.php';
module.exports = function (config, callback) {
  var detailed = typeof config === 'object';
  var request = {
    method: 'GET',
    url: API_URL,
    qs: {
      q: (detailed ? config.search: config),
      field: config.field || 'seeders',
      sorder: config.sorder || 'desc'
    }
  };
  if (detailed) {
    if (config.category) request.qs.q += ' category:' + config.category;
    if (config.page) request.qs.page = config.page;
  }
  re(request, function (err, resp, body) {
    if (err) return callback(err);
    var results;
    try {
      results = JSON.parse(body);
      if (!config.magnet) return callback(null, results);
      else {
        var i = 0;
        (function asyncStrand () {
          console.log(i);
            re({
              method: 'GET',
              url: results.list[i].torrentLink, 
              gzip: true
            }, function (err, resp, body) {
              if (err) return callback(err);
              /*
              var $ = cheerio.load(body);
              results.list[i].torrentLink = $('a[title="Magnet link"]').attr('href');
             */
              var parts = /title="Magnet\s+link"\s+href="([^"]+)"/.exec(body);
              if (parts) results.list[i].torrentLink = parts[1];
              if (i + 1 === results.list.length) return callback(null, results);
              ++i;
              process.nextTick(function () {
                if (typeof global.gc === 'function') global.gc();
                asyncStrand();
              });
            });
        })();
      }
    } catch (e) {
      console.log(e.stack);
      callback(Error('There are less than ' + request.qs.page + ' pages of results.'));
    }
  });
}
