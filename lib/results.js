"use strict";

const fetch = require('./fetch'),
    cheerio = require('cheerio'),
    merge = require('./merge'),
    uri = require('uri-js'),
    idRe = /t(.*)\.html$/,
    hashRe = /\/[0-9A-Z]\.torrent/,
    selector = require('./selector'),
    URLS = require('../config/kickass-urls');

module.exports = {
    KickassResultGroup: KickassResultGroup,
    KickassResult: KickassResult
};

function KickassResultGroup(data) {
  if (!data) return Object.create(KickassResultGroup.prototype);
  Object.setPrototypeOf(data, KickassResultGroup.prototype);
  if (Array.isArray(data.list)) data.list.map(function (v) {
    Object.setPrototypeOf(v, KickassResult.prototype);
    let parts = idRe.exec(v.link);
    if (parts) v.id = parts[1];
  });
  return data;
}

function KickassResult(data) {
  if (!data) return Object.create(KickassResult.prototype);
  Object.setPrototypeOf(data, KickassResult.prototype);
  return data;
}

KickassResult.prototype = {
  getComments() {
    let self = this;
    return new Promise(function (resolve, reject) {
      fetch({
        method: 'GET',
        url: merge(URLS.url, URLS.commmentUrl, self.id),
        gzip: true
      }).then(function (resp) {
        let $ = cheerio.load(JSON.parse(resp.body).html);
        let content = $('div.commentcontent');
        resolve($('div.commentowner').map((i) => {
          return {
            owner: $(this).text().trim(),
            comment: content.eq(i).text().trim()
          };
        }));
      }, function (err) {
        reject(err);
      });
    });
  },
  getDetails() {
    let self = this;
    return new Promise(function (resolve, reject) {
      fetch({
        method: 'GET',
        url: self.link,
        gzip: true
      }).then(function (resp) {
        let $ = cheerio.load(resp.body);
        let description = $('div.data').
              find((ele) => $(ele).children().eq(0).text().trim() === 'Description').
              children().eq(1).text().trim();
        resolve({ description });
      }, function (err) {
        reject(err);
      });
    });
  }
};

KickassResult.fromSelector = function fromSelector(sel) {
  let time  = sel.find('td:nth-child(4)'),
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
