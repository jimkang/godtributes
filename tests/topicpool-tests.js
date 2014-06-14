var assert = require('assert');
// var createTopicPool = require('../topicpool');
var createWordnikSource = require('../wordniksource');

suite('Topic getting', function gettingSuite() {
  test('Test getting from Wordnik source.', function testWordnik(testDone) {
    var source = createWordnikSource();

    source.getTopic(function checkTopic(error, topic) {
      assert.ok(!error);
      assert.equal(typeof topic, 'string');
      assert.ok(topic.length > 0);
      testDone();
    });
  });

  // TODO: Trending topics.
});
