"use strict";
const request = require('request'),
  USER_AGENTS = require('../config/user-agents');

request.defaults({
  jar: true
});

module.exports = function fetch(config) {
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  config.headers['user-agent'] = USER_AGENTS[Math.floor(Math.random()*USER_AGENTS.length)];
  return new Promise(function (resolve, reject) {
    request(config, function (err, resp, body) {
      if (err) reject(err);
      resolve(resp);
    });
  });
};
