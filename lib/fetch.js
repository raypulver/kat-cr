"use strict";
const request = require('request');

module.exports = function fetch(config) {
  return new Promise(function (resolve, reject) {
    request(config, function (err, resp, body) {
      if (err) reject(err);
      resolve(resp);
    });
  });
};
