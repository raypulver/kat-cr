"use strict";
const merge = require('./merge'),
    UnexpectedResponseError = require('./errors').UnexpectedResponseError,
    resultsRe = /results\s+(\d+)-(\d+)\s+from\s+(\d+)/;

function selectResultSummary(selector) {
    let selection = selector('div.tabs + div');
    if (!selection.length) throw UnexpectedResponseError('Could not parse result summary.');
    return selection;
}

function textTrimmer(selection) {
  return selection.text().trim();
}

function parseResultSummary(selector) {
    let selection = selectResultSummary(selector);
    let parts = resultsRe.exec(selector('div.tabs + div'));
    let retval = {};
    if (parts) {
        retval.min_result = parts[1];
        retval.max_result = parts[2];
        retval.total_results = parts[3];
        return retval;
    } else throw UnexpectedResponseError('Selector is correct but results summary is of an unexpected format');

}

function selectEvenRows(selector) {
    return selector('tr.even');
}

function selectOddRows(selector) {
    return selector('tr.odd');
}

function selectMagnetLink(selector) {
    let selection = selector.find('a[title="Torrent magnet link"]');
    if (selector.length && !selection.length) throw UnexpectedResponseError('Magnet link selection failed');
    return selection;
}

function parseMagnetLink(selector) {
    return selectMagnetLink(selector).attr('href');
}

function selectTorrentLink(selector) {
    let selection = selector.find('a[title="Download torrent file"]');
    if (selector.length && !selection.length) throw UnexpectedResponseError('Torrent link selection failed');
    return selection;
}

function parseTorrentLink(selector) {
    return 'http:' + selectTorrentLink(selector).attr('href');
}

function selectLinkAndTitle(selector) {
  let selection = selector.find('a.cellMainLink');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Torrent main link selection failed');
  return selection;
}

function parseLinkAndTitle(selector) {
  let selection = selectLinkAndTitle(selector);
  return {
    title: selection.text().trim(),
    link: selection.attr('href')
  }
}

function selectCreator(selector) {
  let selection = selector.find('a.plain');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Torrent creator selection failed');
  return selection;
}

function parseCreator(selector) {
  return textTrimmer(selectCreator(selector));
}

function parseElite(selector) {
  return !!selector.find('i[title="Elite Uploader"] + a.plain').length;
}

function parseVerify(selector) {
  return !!selector.find('i.ka-verify + a.plain').length;
}

function selectCategory(selector) {
  let selection = selector.find('span.block');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Category block parsing failed');
  selection = selection.find('span:last-child');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Category parsing failed');
  return selection;
}

function parseCategory (selector) {
  return textTrimmer(selectCategory(selector));
}

function selectCommentNo (selector) {
  return selector.find('a.icommentjs');
}

function parseCommentNo(selector) {
  return +textTrimmer(selectCommentNo(selector));
}

function selectSize(selector) {
  let selection = selector.find('td.nobr');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Size parsing failed');
  return selection;
}

function parseSize(selector) {
  return textTrimmer(selector);
}

function selectSeeds(selector) {
  let selection = selector.find('td.green');
  if (selector.length && !selection.length) throw UnexpectedResponseError('Seed count parsing failed');
  return selection;
}

function parseSeeds(selector) {
  return textTrimmer(selectSeeds(selector));
}

function selectLeechs(selector) {
  let selection = selector.find('td.red');
  if (selector.length && !selection.length) throw UnexpectedResponseError("Leech count parsing failed");
  return selection;
}

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


