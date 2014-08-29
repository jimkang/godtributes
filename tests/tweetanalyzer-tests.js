var assert = require('assert');
var tweetAnalyzer = require('../tweetanalyzer');

suite('Exhort targets', function exhortTargetSuite() {
  test('Test tragedy blacklist', function testTragedyBlacklist() {
    assert.ok(!tweetAnalyzer
      .isTextOKToReplyTo('Man, WTF is going in #ferguson'));
    assert.ok(!tweetAnalyzer
      .isTextOKToReplyTo('Man, WTF is going in ferguson'));
    assert.ok(!tweetAnalyzer.isTextOKToReplyTo('Ferguson is so sad.'));
    assert.ok(tweetAnalyzer.isTextOKToReplyTo('WTF Fergie is crazy'));
    assert.ok(!tweetAnalyzer
      .isTextOKToReplyTo('We`re observing genocide in motion.'));
    assert.ok(tweetAnalyzer.isTextOKToReplyTo('My cat just puked!'));
  });
});
