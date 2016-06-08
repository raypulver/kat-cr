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
  getComments: function getComments() {
    let self = this;
    return new Promise(function (resolve, reject) {
      fetch({
        method: 'GET',
        url: merge(URLS.url, URLS.commmentUrl, self.id),
        gzip: true
      }).then(function (resp) {
        let retval = [];
        let $ = cheerio.load(JSON.parse(resp.body).html);
        let content = $('div.commentcontent');
        $('div.commentowner').each(function (i) {
          retval.push({
            owner: $(this).text().trim(),
            comment: content.eq(i).text().trim()
          });
        });
        resolve(retval);
      }, function (err) {
        reject(err);
      });
    });
  },
  getDetails: function () {
    let self = this;
    return new Promise(function (resolve, reject) {
      fetch({
        method: 'GET',
        url: self.link,
        gzip: true
      }).then(function (resp) {
        let retval = {};
        let $ = cheerio.load(resp.body);
        $('div.data').each(function () {
          let children = $(this).children();
          if (children.eq(0).text().trim() === 'Description') retval.description = children.eq(1).text().trim();
        });
        resolve(retval);
      }, function (err) {
        reject(err);
      });
    });
  }
};

KickassResult.fromSelector = function fromSelector(sel) {
  let retval = KickassResult();
  retval.magnetLink = selector.parseMagnetLink(sel);
  retval.torrentLink = selector.parseTorrentLink(sel);
  Object.assign(retval, selector.parseLinkAndTitle(sel));
  retval.creator = selector.parseCreator(sel);
  retval.elite = selector.parseElite(sel);
  retval.verified = retval.elite || selector.parseVerify(sel);
  retval.category = selector.parseCategory(sel);
  let parts = idRe.exec(retval.link);
  if (parts) retval.id = parts[1];
  let time = sel.find('td:nth-child(4)');
  retval.pubDate = new Date(time.attr('title'));
  retval.comments = selector.parseCommentNo(sel);
  retval.size = selector.parseSize(sel);
  let files = sel.find('td:nth-child(3)');
  retval.files = files.text().trim();
  retval.seeds = selector.parseSeeds(sel);
  retval.leechs = selector.parseLeechs(sel);
  parts = hashRe.exec(retval.torrentLink);
  if (parts) retval.hash = parts[1];
  return retval;
}
