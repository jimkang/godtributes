var assert = require('assert');
var isCool = require('../iscool');

suite('Custom blacklist', function customBlacklistSuite() {
  test('Test case insensitivity', function testCaseInsensitivity() {
    assert.ok(isCool('jello'));
    assert.ok(isCool('Jello'));
    assert.ok(!isCool('Negro'));
    assert.ok(!isCool('negro'));
    assert.ok(!isCool('Coon'));
    assert.ok(!isCool('coon'));
  });  
});

suite('False positives', function falsePositivesSuite() {
  test('Test false positives', function testFalsePositives() {
    assert.ok(!isCool('IO'));
    assert.ok(isCool('iOS'));
    assert.ok(!isCool('imo'));
    assert.ok(!isCool('IMO'));
  });
});
