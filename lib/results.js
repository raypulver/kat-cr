/**
 * @module kat-cr/lib/results
 * @description
 * Exports a class which contains a search result, as well a container for results
 */

"use strict";

const fetch = require('./fetch'),
  cheerio = require('cheerio'),
  merge = require('./merge'),
  uri = require('uri-js'),
  idRe = /t(.*)\.html$/,
  hashRe = /\/[0-9A-Z]\.torrent/,
  selector = require('./selector'),
  URLS = require('../config/kickass-urls');

/** @namespace KickassResultGroup **/

/**
 * @typedef {Object} KickassResultGroup
 * @property {number} total_results The total amount of search results returned by the query
 * @property {string} link Set to the domain name of Kickass Torrents
 * @property {string} language Always 'en-us'
 * @property {Array.<module:kat-cr/lib/results~KickassResult>} list The list of KickassResult objects
 * @see {module:kat-cr/lib/kat}
 */

/**
 * @description
 * Returns a KickassResultGroup
 * @constructs KickassResultGroup Empty container for results
 * @see {module:kat-cr/lib/results~KickassResultGroup}
 */

module.exports.KickassResultGroup = function KickassResultGroup(data) {
  if (!data) return Object.create(KickassResultGroup.prototype);
  Object.setPrototypeOf(data, KickassResultGroup.prototype);
  if (Array.isArray(data.list)) data.list.map(function(v) {
    Object.setPrototypeOf(v, KickassResult.prototype);
    let parts = idRe.exec(v.link);
    if (parts) v.id = parts[1];
  });
  return data;
}

let KickassResultGroup = module.exports.KickassResultGroup;

/** @namespace KickassResult **/

/**
 * @typedef {Object} KickassResult
 * @property {string} title The title of the torrent
 * @property {string} category The category of torrent
 * @property {string} link The link to the dedicated torrent page on Kickass Torrents
 * @property {Date} pubDate A Date instance representing the date the torrent was published
 * @property {string} torrentLink The direct http link to the torrent file
 * @property {string} magnetLink The magnet link associated with the torrent
 * @property {number} files The amount of files associated with the torrent
 * @property {number} comments The amount of comments the torrent received on Kickass Torrents
 * @property {number} hash A hash digest of the torrent
 * @property {number} peers The amount of peers associated with the torrent
 * @property {number} seeds The amount of seeders associated with the torrent
 * @property {number} leechs The amount of leechers associated with the torrent
 * @property {number} size The size of the torrent in bytes
 * @property {boolean} verified Whether or not the torrent is verified
 * @property {boolean} elite Whether or not the torrent is elite
 * @property {string} id The unique torrent ID on Kickass Torrents that can be used to call API functions
 * @see {module:kat-cr/lib/results~KickassResultGroup}
 */

/**
 * @description
 * Returns a KickassResult
 * @constructs KickassResult An empty object for a search result
 * @see {module:kat-cr/lib/results~KickassResult}
 */

module.exports.KickassResult = function KickassResult(data) {
  if (!data) return Object.create(KickassResult.prototype);
  Object.setPrototypeOf(data, KickassResult.prototype);
  return data;
}

let KickassResult = module.exports.KickassResult;

module.exports.KickassResult.prototype = {

  /** @namespace Comment */

  /**
   * @typedef {Object} Comment
   * @property {string} owner The comment poster
   * @property {string} comment The comment body
   */

  /**
   * @memberof KickassResult
   * @instance
   * @description
   * Retrieves the list of comments associated with this torrent
   * @returns {Promise<Array.<module:kat-cr/lib/results~Comment>>} Promise which resolves with an array of Comment objects
   */
  getComments: function getComments() {
    let self = this;
    return new Promise(function(resolve, reject) {
      fetch({
        method: 'GET',
        url: merge(URLS.url, URLS.commmentUrl, self.id),
        gzip: true
      }).then(function(resp) {
        let $ = cheerio.load(JSON.parse(resp.body).html);
        let content = $('div.commentcontent');
        resolve($('div.commentowner').map((i) => {
          return {
            owner: $(this).text().trim(),
            comment: content.eq(i).text().trim()
          };
        }));
      }, function(err) {
        reject(err);
      });
    });
  },

  /** @namespace DetailsPage */

  /**
   * @typedef {Object} DetailsPage
   * @property {string} description The torrent description
   */

  /**
   * @memberof KickassResult
   * @instance
   * @description
   * Retrieves the details associated with this torrent
   * @returns {Promise.<module:kat-cr/lib/result~DetailsPage>} Promise which resolves with a DetailsPage object
   */
  getDetails: function getDetails() {
    let self = this;
    return new Promise(function(resolve, reject) {
      fetch({
        method: 'GET',
        url: self.link,
        gzip: true
      }).then(function(resp) {
        let $ = cheerio.load(resp.body);
        let description = $('div.data').
        find((ele) => $(ele).children().eq(0).text().trim() === 'Description').
        children().eq(1).text().trim();
        resolve({
          description
        });
      }, function(err) {
        reject(err);
      });
    });
  }
};

/**
 * @description
 * Converts a Cheerio selector representing a result into a KickassResult object
 * @param {external:Cheerio} selector Cheerio selection representing one result row
 * @returns {module:kat-cr/lib/results~KickassResult} A KickassResult object representing the torrent
 * @memberof KickassResult
 * @static
 */

module.exports.KickassResult.fromSelector = function fromSelector(sel) {
  let time = sel.find('td:nth-child(4)'),
    files = sel.find('td:nth-child(3)');
  let retval = Object.assign(KickassResult(), {
    magnetLink: selector.parseMagnetLink(sel),
    torrentLink: selector.parseTorrentLink(sel)
  });
  Object.assign(retval, selector.parseLinkAndTitle(sel));
  let parts = idRe.exec(retval.link);
  if (parts) retval.id = parts[1];
  Object.assign(retval, {
    creator: selector.parseCreator(sel),
    elite: selector.parseElite(sel),
    verified: retval.elite || selector.parseVerify(sel),
    category: selector.parseCategory(sel),
    pubDate: new Date(time.attr('title')),
    comments: selector.parseCommentNo(sel),
    size: selector.parseSize(sel),
    files: files.text().trim(),
    seeds: selector.parseSeeds(sel),
    leechs: selector.parseLeechs(sel)
  });
  parts = hashRe.exec(retval.torrentLink);
  if (parts) retval.hash = parts[1];
  return retval;
}
