"use strict"
const fetch = require('./fetch'),
    merge = require('./merge'),
    qs = require('query-string'),
    cheerio = require('cheerio'),
    uri = require('uri-js'),
    KickassResultGroup = require('./results').KickassResultGroup,
    KickassResult = require('./results').KickassResult,
    URLS = require('../config/kickass-urls'),
    selector = require('./selector');

module.exports = kickass;

kickass.getURL = function () {
  return URLS.url;
};

kickass._requestRawBody = function(config) {
    var detailed = typeof config === 'object';
    var request = {
        method: 'GET',
        url: ((detailed && config.category) ? merge(URLS.url, URLS.searchUrl, encodeURIComponent(config.search + ' category:' + config.category)) : merge(URLS.url, URLS.searchUrl, encodeURIComponent((detailed ? config.search : config)))),
        qs: {
            field: config.field || 'seeders',
            sorder: config.sorder || 'desc'
        }
    };
    request.gzip = true;
    if (detailed) {
        if (config.page) request.qs.page = config.page;
    }
    return fetch(request);
}

function kickass(config, callback) {
    let promise = new Promise(function(resolve, reject) {
        kickass._requestRawBody(config).then(function(resp) {
            let $ = cheerio.load(resp.body);
            try {
                if (typeof config === 'object' && config.page !== 'undefined' && typeof qs.parse(uri.parse(resp.request.href).query).page === 'undefined') return reject(Error('There are less than ' + config.page + ' pages of results'));
                if ($('div.errorpage').length) return reject(Error('No results found'));
                let data = KickassResultGroup();
                Object.assign(data, selector.parseResultSummary($));
                data.link = URLS.url;
                data.language = 'en-us';
                data.list = [];
                let odds = selector.selectOddRows($),
                    evens = selector.selectEvenRows($);
                odds.each(function(i) {
                    data.list.push(KickassResult.fromSelector($(this)));
                    if (i < evens.length) data.list.push(KickassResult.fromSelector(evens.eq(i)));
                });
                if (!config.detailed) return resolve(data);
                else {
                    (function strandGenerator(transitionFn) {
                        return function asyncStrand(list, cb, idx) {
                            if (typeof idx === 'undefined') idx = 0;
                            list[idx].getDetails().then(function(details) {
                                Object.assign(list[idx], details);
                                if (idx + 1 === list.length) cb(null);
                                else transitionFn(function() {
                                    asyncStrand(list, cb, idx + 1);
                                });
                            }, function(err) {
                                cb(err);
                            });
                        };
                    })(process.nextTick)(data.list, function(err) {
                        if (err) reject(err);
                        else resolve(results);
                    });
                }
            } catch (e) {
                console.log(e.stack);
            }
        }, function(err) {
            reject(err);
        });
    });
    if (typeof callback === 'function') promise.then(function(results) {
        callback(null, results);
    }, function(err) {
        callback(err);
    });
    else return promise;
};
