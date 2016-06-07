"use strict"
const fetch = require('./fetch'),
    cheerio = require('cheerio'),
    merge = require('./merge'),
    KickassResultGroup = require('./results').KickassResultGroup,
    URLS = require('../config/kickass-urls');

module.exports = function kickass(config, callback) {
    var detailed = typeof config === 'object';
    var request = {
        method: 'GET',
        url: merge(URLS.url, URLS.jsonUrl),
        qs: {
            q: (detailed ? config.search : config),
            field: config.field || 'seeders',
            sorder: config.sorder || 'desc'
        }
    };
    if (detailed) {
        if (config.category) request.qs.q += ' category:' + config.category;
        if (config.page) request.qs.page = config.page;
    }
    let promise = new Promise(function(resolve, reject) {
        fetch(request).then(function(resp) {
            let results;
            try {
                results = KickassResultGroup(JSON.parse(resp.body));
                if (!config.detailed) return resolve(results);
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
                    })(process.nextTick)(results.list, function(err) {
                        if (err) reject(err);
                        else resolve(results);
                    });

                }
            } catch (e) {
                reject(Error('There are less than ' + request.qs.page + ' pages of results.'));
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
