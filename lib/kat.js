/**
 * @module kat-cr/lib/kat
 * @description Exports the primary library function
 */

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

/** @namespace KickassSearchConfig */

/**
 * @typedef {Object} KickassSearchConfig
 * @property {string} search The search query
 * @property {string} category The search category
 * @property {string} field The field by which the results are sorted, default is 'seeders'; other possibilities include 'files_count', 'size', and 'leechers'
 * @property {string} sorder The order the results are displayed in, default is 'desc'; alternatively, 'asc' can be provided for ascending order
 * @see {module:kat-cr/lib/kat}
 */


/**
 * @description
 * Performs a search on the KickassTorrents database by making an HTTP request 
 * to the same endpoint used in the browser search engine provided by Kickass
 * Torrents, which has the most features
 * @param {module:kat-cr/lib/kat~KickassSearchConfig} config Search engine request configuration
 * @returns {Promise.<module:kat-cr/lib/results~KickassResultGroup>} A promise which resolves with a KickassResultGroup object
 * @example
 * // Retrieve the torrent link of the most seeded South Park TV torrent
 * kickass({
 *   search: 'south park',
 *   category: 'tv',
 * }).then(function (results) {
 *   // results is a KickassResultGroup
 *   // up to 25 items in results.list, each item is a KickassResult
 *   console.log(results.list[0].torrentLink);
 * });
 *
 * // Retrieve the magnet link of the newest torrent for South Park movies
 * kickass({
 *   search: 'south park',
 *   category: 'movies',
 *   field: 'time_add'
 * }).then(function (results) {
 *   console.log(results.list[0].magnetLink);
 * });
 */

module.exports = function kickass(config, callback) {
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
              reject(e);
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

/**
 * @description
 * Transforms a configuration object into an http request and returns a promise which resolves with the response
 * @param {module:kat-cr/lib/kat~KickassSearchConfig} config The details of the search request
 * @returns {Promise.<external:HTTPResponse>} A promise resolving with the response body
 */

module.exports._requestRawBody = function requestRawBody (config) {
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

/**
 * @description
 * A function returning the URL to Kickass Torrents used by the library.
 * This can be configured by editing the values in config/kickass-urls.json
 * @returns {string} The URL to Kickass Torrents
 */

module.exports.getURL = function getURL () {
  return URLS.url;
};
