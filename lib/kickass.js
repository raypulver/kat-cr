#!/usr/bin/env node
var re = require('request'),
    API_URL = 'http://kickass.so/json.php';
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
    else {
      try {
        callback(null, JSON.parse(body));
      }
      catch (e) {
        callback(Error('There are less than ' + request.qs.page + ' pages of results.'));
      }
    }
  });
}
