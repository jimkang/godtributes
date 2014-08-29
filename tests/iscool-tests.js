var assert = require('assert');
var isCool = require('../iscool');

suite('Custom blacklist', function customBlacklistSuite() {
  test('Test case insensitivity', function testCaseInsensitivity() {
    assert.ok(isCool('jello'));
    assert.ok(isCool('Jello'));
    assert.ok(!isCool('Negro'));
    assert.ok(!isCool('negro'));
  });
});
