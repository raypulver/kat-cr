/**
 * @module kat-cr/lib/selector
 * @description
 * Exports all of the web scraping logic into testable functions
 */

"use strict";

const merge = require('./merge'),
    bytes = require('bytes'),
    UnexpectedResponseError = require('./errors').UnexpectedResponseError,
    resultsRe = /results\s+(\d+)-(\d+)\s+from\s+(\d+)/;
/**
 * The jQuery like object returned from cheerio.load
 * @external Cheerio
 * @see {@link https://github.com/cheeriojs/cheerio}
 */

/**
 * @description
 * Selects the search result summary block
 * @param {external:Cheerio} selector Cheerio selector obtained from entire webpage
 * @returns {external:Cheerio} The cheerio selection representing the result summary
 * @throws {UnexpectedResponseError} Throws if selection failed
 */

function selectResultSummary(selector) {
    let selection = selector('div.tabs + div');
    if (!selection.length) throw UnexpectedResponseError('Could not parse result summary.');
    return selection;
}

/**
 * @description
 * Helper function to return the trimmed text from a selection
 * @param {external:Cheerio} selection Cheerio selection obtained from selector
 * @returns {string} The string of text contained in the selection
 */

function textTrimmer(selection) {
  return selection.text().trim();
}

/**
 * @typedef {Object} ResultSummary
 * @property {number} min_result The minimum result number of search result
 * @property {number} max_result The maximum result number of search result
 * @property {number} total_results The total results found
 */

/**
 * @description
 * Parses the result summary from a result summary selection
 * @param {external:Cheerio} selection Cheerio selection
 * @returns {ResultSummary} The parsed result summary
 */

function parseResultSummary(selector) {
    let parts = resultsRe.exec(selector('div.tabs + div'));
    if (parts) {
        return {
          min_result: +parts[1],
          max_result: +parts[2],
          total_results: +parts[3]
        };
    } else throw UnexpectedResponseError('Selector is correct but results summary is of an unexpected format');

}

/**
 * @description
 * Selects the even rows in the results table
 * @param {external:Cheerio} selector Cheerio selector obtained from entire webpage
 * @returns {external:Cheerio} The cheerio selection representing the even rows
 */

function selectEvenRows(selector) {
    return selector('tr.even');
}

/**
 * @description
 * Selects the odd rows in the results table
 * @param {external:Cheerio} selector Cheerio selector obtained from entire webpage
 * @returns {external:Cheerio} The cheerio selection representing the odd rows
 */

function selectOddRows(selector) {
    return selector('tr.odd');
}

/**
 * @description
 * Selects the magnet link
 * @param {external:Cheerio} selection Cheerio selection obtained from selector
 * @returns {external:Cheerio} The cheerio selection representing the magnet link
 * @throws {UnexpectedResponseError} Throws if selection failed
 */

function selectMagnetLink(selector) {
    let selection = selector.find('a[title="Torrent magnet link"]');
    if (selector.length && !selection.length) throw UnexpectedResponseError('Magnet link selection failed');
    return selection;
}

/**
 * @description
 * Parses the magnet link from selection
 * @param {external:Cheerio} selection Cheerio selection representing magnet link
 * @returns {string} Torrent magnet link
 */

function parseMagnetLink(selector) {
    return selectMagnetLink(selector).attr('href');
}

/**
 * @description
 * Selects the torrent link
 * @param {external:Cheerio} selection Cheerio selection obtained from selector
 * @returns {external:Cheerio} The cheerio selection representing the torrent link
 * @throws {UnexpectedResponseError} Throws if selection failed
 */

function selectTorrentLink(selector) {
    let selection = selector.find('a[title="Download torrent file"]');
    if (selector.length && !selection.length) throw UnexpectedResponseError('Torrent link selection failed');
    return selection;
}

/**
 * @description
 * Parses the torrent link from selection
 * @param {external:Cheerio} selection Cheerio selection representing torrent link
 * @returns {string} Torrent link
 */

function parseTorrentLink(selector) {
    return 'http:' + selectTorrentLink(selector).attr('href');
}

/**
 * @description
 * Selects the main link and title from a single result, the main link is 
 * the link to the dedicated webpage for the torrent
 * @param {external:Cheerio} selection Cheerio selection obtained from selector
 * @returns {external:Cheerio} The cheerio selection representing the link and title
 * @throws {UnexpectedResponseError} Throws if selection failed
 */

function selectLinkAndTitle(selector) {
  let selection = selector.find('a.cellMainLink');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Torrent main link selection failed');
  return selection;
}

/**
 * @typedef {Object} LinkTitlePair
 * @property {string} link The link to the torrent webpage
 * @property {string} title The title of the torrent
 */

/**
 * @description
 * Parses the link and title from the link and title selection
 * @param {external:Cheerio} selection Cheerio selection representing link and title
 * @returns {LinkTitlePair} The link/title pair
 */

function parseLinkAndTitle(selector) {
  let selection = selectLinkAndTitle(selector);
  return {
    title: selection.text().trim(),
    link: selection.attr('href')
  }
}

/**
 * @description
 * Selects the torrent creator from one of the results
 * @param {external:Cheerio} selector Cheerio selection obtained from selector
 * @returns {external:Cheerio} Selection representing torrent creator tag
 * @throws {UnexpectedResponseError} Throws if selection fails
 */

function selectCreator(selector) {
  let selection = selector.find('a.plain');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Torrent creator selection failed');
  return selection;
}

/**
 * @description
 * Parses creator string from creator selection
 * @param {external:Cheerio} selector Cheerio selection representing torrent creator
 * @returns {string} String representing torrent creator
 */

function parseCreator(selector) {
  return textTrimmer(selectCreator(selector));
}

/**
 * @description
 * Parses elite status of torrent, indicating that the torrent was posted
 * by a Kickass Torrents user with "elite" status
 * @param {external:Cheerio} selector Cheerio selection representing single result
 * @returns {boolean} True if the torrent is elite
 */

function parseElite(selector) {
  return !!selector.find('i[title="Elite Uploader"] + a.plain').length;
}

/**
 * @description
 * Parses verified status of torrent, indicating that the torrent was posted
 * by a Kickass Torrents user with "verified" status
 * @param {external:Cheerio} selector Cheerio selection representing single result
 * @returns {boolean} True if the torrent is verified
 */

function parseVerify(selector) {
  return !!selector.find('i.ka-verify + a.plain').length;
}

/**
 * @description
 * Selects the torrent category from one of the results
 * @param {external:Cheerio} selector Cheerio selection obtained from selector
 * @returns {external:Cheerio} Selection representing torrent category tag
 * @throws {UnexpectedResponseError} Throws if selection fails
 */

function selectCategory(selector) {
  let selection = selector.find('span.block');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Category block parsing failed');
  selection = selection.find('span:last-child');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Category parsing failed');
  return selection;
}

/**
 * @description
 * Parses category string from category selection
 * @param {external:Cheerio} selector Cheerio selection representing torrent category
 * @returns {string} String representing torrent category
 */

function parseCategory (selector) {
  return textTrimmer(selectCategory(selector));
}

/**
 * @description
 * Selects the comment count from one of the results
 * @param {external:Cheerio} selector Cheerio selection obtained from selector
 * @returns {external:Cheerio} Selection representing torrent comment number
 */

function selectCommentNo (selector) {
  return selector.find('a.icommentjs');
}

/**
 * @description
 * Parses comment count from comment count selection
 * @param {external:Cheerio} selector Cheerio selection representing comment count
 * @returns {number} Amount of comments the torrent received on Kickass Torrents
 */

function parseCommentNo(selector) {
  return +textTrimmer(selectCommentNo(selector));
}

/**
 * @description
 * Selects the torrent size from a result selection. Note that torrent size has nothing to do with the filesize of the torrent file, but rather the total size of the files provided by the torrent
 * @param {external:Cheerio} selector Cheerio selection obtained from selector
 * @returns {external:Cheerio} Selection representing torrent total size
 * @throws {UnexpectedResponseError} Throws if selection fails
 */

function selectSize(selector) {
  let selection = selector.find('td.nobr');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Size parsing failed');
  return selection;
}

/**
 * @description
 * Parses the size of the torrent from selection
 * @param {external:Cheerio} selector Cheerio selection representing torrent size
 * @returns {number} Total size of files provided by torrent, in bytes
 */

function parseSize(selector) {
  return bytes(textTrimmer(selector));
}

/**
 * @description
 * Selects the seed count from a result selection
 * @param {external:Cheerio} selector Cheerio selection obtained from selector
 * @returns {external:Cheerio} Selection representing torrent seed count
 * @throws {UnexpectedResponseError} Throws if selection fails
 */

function selectSeeds(selector) {
  let selection = selector.find('td.green');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Seed count parsing failed');
  return selection;
}

/**
 * @description
 * Parses the seed count of the from selection
 * @param {external:Cheerio} selector Cheerio selection representing seed count
 * @returns {number} Total seeders in swarm
 */

function parseSeeds(selector) {
  return textTrimmer(selectSeeds(selector));
}

/**
 * @description
 * Selects the leech count from a result selection
 * @param {external:Cheerio} selector Cheerio selection obtained from selector
 * @returns {external:Cheerio} Selection representing torrent leech count
 * @throws {UnexpectedResponseError} Throws if selection fails
 */

function selectLeechs(selector) {
  let selection = selector.find('td.red');
  if (selector.length && !selection.length) throw UnexpectedResponseError("Leech count parsing failed");
  return selection;
}

/**
 * @description
 * Parses the leech count of the from selection
 * @param {external:Cheerio} selector Cheerio selection representing leech count
 * @returns {number} Total leechers in swarm
 */

function parseLeechs(selector) {
  return textTrimmer(selectLeechs(selector));
}



module.exports = {
        _selectResultSummary: selectResultSummary,
        parseResultSummary: parseResultSummary,
        _selectTorrentLink: selectTorrentLink,
        parseTorrentLink: parseTorrentLink,
        _selectMagnetLink: selectMagnetLink,
        parseMagnetLink: parseMagnetLink,
        _selectLinkAndTitle: selectLinkAndTitle,
        parseLinkAndTitle: parseLinkAndTitle,
        selectOddRows: selectOddRows,
        selectEvenRows: selectEvenRows,
        _selectCreator: selectCreator,
        parseCreator: parseCreator,
        _selectCommentNo: selectCommentNo,
        parseCommentNo: parseCommentNo,
        _selectSize: selectSize,
        parseSize: parseSize,
        _selectCategory: selectCategory,
        parseCategory: parseCategory,
        _selectSeeds: selectSeeds,
        parseSeeds: parseSeeds,
        _selectLeechs: selectLeechs,
        parseLeechs: parseLeechs,
        parseElite: parseElite,
        parseVerify: parseVerify
};


