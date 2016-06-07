"use strict";

const fetch = require('./fetch'),
    cheerio = require('cheerio'),
    merge = require('./merge'),
    idRe = /t(.*)\.html$/,
    URLS = require('../config/kickass-urls');

module.exports = {
    KickassResultGroup: KickassResultGroup,
    KickassResult: KickassResult
};

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
        retval.magnetLink = $('a[title="Magnet link"]').attr('href');
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

function KickassResultGroup(data) {
  Object.setPrototypeOf(data, KickassResultGroup.prototype);
  data.list.map(function (v) {
    Object.setPrototypeOf(v, KickassResult.prototype);
    let parts = idRe.exec(v.link);
    if (parts) v.id = parts[1];
  });
  return data;
}

function KickassResult(data) {
  Object.setPrototypeOf(data, KickassResult.prototype);
  return data;
}
