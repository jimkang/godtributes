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

  test('Test getting part of speech from Wordnik source', 
    function testGetPartOfSpeech(testDone) {
      var source = createWordnikSource();

      source.getPartOfSpeech('students', 
        function checkResult(error, part) {
          assert.ok(!error);
          assert.equal(part, 'noun');
          testDone();
        }
      );
    }
  );

  test('Test getting parts of speech from Wordnik source', 
    function testGetPartsOfSpeech(testDone) {
      var source = createWordnikSource();

      source.getPartsOfSpeech([
          'haven\'t',        
          'students',
          'realize',
          'the',
          'importance',
          'could',
          'be',
          'a',
          'Nolan',
          'Batman',
          'inaccessible',
          'DS_Store',
          'morally',
        ],
        function checkResult(error, parts) {
          assert.ok(!error);
          assert.deepEqual(parts, 
            [ 
              'noun-possessive',            
              'noun',
              'verb-transitive',
              'definite-article',
              'noun',
              'auxiliary-verb',
              'verb-intransitive',
              'noun',
              'proper-noun',
              'proper-noun',
              'adjective',
              null,
              'adverb'
            ]
          );
          testDone();
        }
      );
    }
  );

  // TODO: Trending topics.
});
