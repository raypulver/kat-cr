#!/usr/local/bin/mocha

var expect = require('chai').expect,
    kickass = require('..'),
    dns = require('dns'),
    results = require('../lib/results'),
    cheerio = require('cheerio'),
    selector = require('../lib/selector'),
    KickassTorrentGroup = results.KickassTorrentGroup,
    KickassTorrent = results.KickassTorrent,
    URLS = require('../config/kickass-urls'),
    uri = require('uri-js'),
    fetch = require('../lib/fetch'),
    merge = require('../lib/merge'),
    searchPageResult,
    err, katErr;

before(function(done) {
  this.timeout(50000);
    Promise.all([new Promise(function(resolve, reject) {
        dns.resolve('www.google.com', function(e) {
            err = e;
            resolve();
        });
    }), new Promise(function(resolve, reject) {
        dns.resolve(uri.parse(URLS.url).host, function(e) {
            katErr = e;
            if (!katErr) kickass._requestRawBody('south park').then(function(response) {
                searchPageResult = cheerio.load(response.body);
                resolve();
            }, function(err) {
                resolve();
            });
        });
    })]).then(function() {
        done();
    });
});

describe('uri merge module', function() {
    it('should combine any number of URI segments', function() {
        expect(merge('http://', 'www.google.com', 'path')).to.equal('http://www.google.com/path');
    });
    it('should combine a search query', function() {
        expect(merge('http://kat.cr', 'usearch', encodeURIComponent('south park'))).to.equal('http://kat.cr/usearch/south%20park');
    });
});

describe('test runner network connectivity', (function() {
    if (err) return function() {
        it('test runner must be connected to the internet', function() {
            expect(false).to.be.true;
        });
    };
    return function() {
        it('test runner is connected', function() {
            expect(1).to.eql(1);
        });
    };
})());

if (!err) {
    describe('status of ' + uri.parse(URLS.url).host, function() {
        it('is still the domain name', function() {
            expect(katErr).to.be.null;
        });
        if (!katErr) it('still serves json', function() {
            fetch({
                method: 'GET',
                url: uri.resolve(URLS.url, URLS.jsonUrl),
                qs: {
                    q: 'south park'
                }
            }).then(function(resp) {
                try {
                    JSON.parse(resp.body);
                    expect(true).to.be.true;
                } catch (e) {
                    expect(true).to.be.false;
                }
            }, function(err) {
                expect(true).to.be.false;
            });
        });
    });
    if (!katErr) {
        describe('web scraping selectors', function() {
            it('should be able to select the results summary', function() {
                expect(selector._selectResultSummary.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the even rows', function() {
                expect(selector.selectEvenRows(searchPageResult).length).to.be.ok;
            });
            it('should be able to select the odd rows', function() {
                expect(selector.selectOddRows(searchPageResult).length).to.be.ok;
            });
            it('should be able to select the magnet link', function() {
                expect(selector._selectMagnetLink.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the torrent link', function() {
                expect(selector._selectTorrentLink.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the main link and title', function() {
                expect(selector._selectLinkAndTitle.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the creator', function() {
                expect(selector._selectCreator.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the category', function() {
                expect(selector._selectCategory.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the size', function() {
                expect(selector._selectSize.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the seed count', function() {
                expect(selector._selectSeeds.bind(null, searchPageResult)).to.not.throw;
            });
            it('should be able to select the leech count', function() {
                expect(selector._selectLeechs.bind(null, searchPageResult)).to.not.throw;
            });
        });
        describe('kickass module', function() {
            it('returns results as a KickassTorrentGroup', function() {
                kickass('south park').then(function(results) {
                    expect(Object.getPrototypeOf(results)).to.equal(KickassTorrentGroup.prototype);
                }, function(err) {
                    expect(err).to.be.null;
                });
            });
            it('can search by category', function() {
                kickass({
                    search: 'south park',
                    category: 'tv'
                }).then(function(results) {
                    results.list.forEach(function(v) {
                        expect(v.category).to.equal('tv');
                    });
                }, function(err) {
                    expect(err).to.be.null;
                });
            });
            it('can be passed a callback or return a promise', function() {
                expect(kickass('south park')).to.be.an.instanceof(Promise);
                expect(kickass('south park', function(err, results) {
                    expect(err).to.be.null;
                })).to.be.undefined;
            });
        });
    }
}
