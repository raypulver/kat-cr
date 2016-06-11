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
  errors = require('../lib/errors'),
  merge = require('../lib/merge'),
  ArgvParser = require('../lib/argv'),
  searchPageResult,
  err, katErr, gotAnyResults;

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
        gotAnyResults = !!selector.selectEvenRows(searchPageResult).length || !!selector.selectEvenRows(searchPageResult).length;
        resolve();
      }, function(err) {
        resolve();
      });
    });
  })]).then(function() {
    done();
  });
});

describe('argv parser', function () {
  var opts = [{
    long: 'option',
    short: 'o',
    type: 'string'
  }, {
    long: 'flag',
    short: 'f',
    type: null
  }, {
    short: 'p',
    long: 'poption',
    type: 'number'
  }];
  ArgvParser._buildRegExps(opts);
  it('should permute arguments', function () {
    expect(ArgvParser._permuteArgv(['-abc'], opts)).to.eql(['-a', '-b', '-c']);
    expect(ArgvParser._permuteArgv(['-p2', '-abc', '--woop'], opts)).to.eql(['-p', '2', '-a', '-b', '-c', '--woop']);
  });
  it('should parse long options or short options', function () {
    var parser = ArgvParser(opts);
    var result = parser('node kickass --option=value --flag'.split(/\s+/));
    expect(result.flag).to.be.true;
    expect(result.option).to.equal('value');
    result = parser('node kickass -o value -f'.split(/\s+/));
    expect(result.option).to.equal('value');
    expect(result.flag).to.be.true;
  });
  it('should throw when a required argument is not passed', function () {
    var parser = ArgvParser(opts);
    expect(parser.bind(null, 'node kickass -o -f'.split(/\s+/))).to.throw(/requires an argument/);
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

describe('test runner network connectivity', function() {
  it('test runner must be connected to the internet', function() {
    expect(err).to.be.null;
  });
});

describe('status of ' + uri.parse(URLS.url).host, function() {
  before(function() {
    if (err) this.skip();
  });
  it('is still the domain name', function() {
    expect(katErr).to.be.null;
  });
});
describe('main web scraping selectors', function() {
  before(function() {
    if (err || katErr) this.skip();
  });
  it('should be able to select the results summary', function() {
    expect(selector._selectResultSummary.bind(null, searchPageResult)).to.not.throw;
  });
  it('should be able to select the even rows', function() {
    expect(selector.selectEvenRows(searchPageResult).length).to.be.ok;
  });
  it('should be able to select the odd rows', function() {
    expect(selector.selectOddRows(searchPageResult).length).to.be.ok;
  });
});
describe('web scraping sub selectors', function() {
  before(function() {
    if (!(selector.selectEvenRows(searchPageResult).length || selector.selectOddRows(searchPageResult).length)) {
      this.skip();
    }
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
  before(function() {
    if (!gotAnyResults) this.skip();
  });
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
