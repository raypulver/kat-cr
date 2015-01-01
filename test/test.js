#!/usr/local/bin/mocha
var expect = require('chai').expect,
    forEachRight = require('../lib/foreach-right');
describe('forEach right module', function () {
  it('should halt execution after returning false', function () {
    var arr = [];
    forEachRight([4, 3, 2, 1], function (v, i) {
      this.push(v);
      if (i === 2) return false;
    }, arr);
    expect(arr.length).to.equal(2);
    expect(arr[0]).to.equal(1);
    expect(arr[1]).to.equal(2);
  });
  it('should do forEach backwards', function () {
    var arr = [];
    forEachRight([4, 3, 2], function (v) {
      this.push(v);
    }, arr);
    expect(arr.length).to.equal(3);
    expect(arr[0]).to.equal(2);
    expect(arr[1]).to.equal(3);
    expect(arr[2]).to.equal(4);
  });
});
