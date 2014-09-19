var assert = require('assert');
// var createTopicPool = require('../topicpool');
var createWordnikSource = require('../wordniksource');

suite('Topic getting', function gettingSuite() {
  test('Test getting from Wordnik source.', function testWordnik(testDone) {
    var source = createWordnikSource();

    source.getTopic(function checkTopic(error, topic) {
      assert.ok(!error, error);
      assert.equal(typeof topic, 'string');
      assert.ok(topic.length > 0);
      testDone();
    });
  });

  test('Test getting parts of speech from Wordnik source', 
    function testGetPartsOfSpeech(testDone) {
      var source = createWordnikSource();

      source.getPartsOfSpeech('students', 
        function checkResult(error, parts) {
          assert.ok(!error, error);
          assert.deepEqual(parts, ['noun']);
          testDone();
        }
      );
    }
  );

  test('Test getting parts of speech from Wordnik source for many words', 
    function testGetPartsOfSpeech(testDone) {
      var source = createWordnikSource();

      source.getPartsOfSpeechForMultipleWords([
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
          'feeds'
        ],
        function checkResult(error, parts) {
          assert.ok(!error, error);
          assert.deepEqual(parts, 
            [
              [
                  'noun-possessive'
              ],
              [
                  'noun'
              ],
              [
                'verb-transitive',
                'verb-transitive',
                'verb-transitive',
                'verb-transitive'
              ],
              [
                'definite-article',
                'definite-article',
                'definite-article',
                'definite-article'
              ],
              [
                'noun',
                'noun',
                'noun',
                'noun'
              ],
              [
                'auxiliary-verb',
                'auxiliary-verb',
                'auxiliary-verb'
              ],
              [
                'verb-intransitive',
                'verb-intransitive',
                'verb-intransitive',
                'verb-intransitive'
              ],
              [
                'noun',
                'noun',
                'noun',
                'noun'
              ],
              [
                'proper-noun',
                'proper-noun'
              ],
              [
                'proper-noun',
                'proper-noun',
                'proper-noun'
              ],
              [
                'adjective'
              ],
              [                  
              ],
              [
                'adverb',
                'adverb'
              ],
              [
                'noun', 'verb'
              ]
            ]            
          );
          testDone();
        }
      );
    }
  );

  test('Test getting word frequency from Wordnik source', 
    function testGetWordFrequency(testDone) {
      var source = createWordnikSource();

      source.getWordFrequency('students', 
        function checkResult(error, frequency) {
          assert.ok(!error, error);
          assert.equal(frequency, 1105);
          testDone();
        }
      );
    }
  );

  test('Test getting word frequencies from Wordnik source', 
    function testGetWordFrequencies(testDone) {
      var source = createWordnikSource();

      source.getWordFrequencies([
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
        function checkResult(error, frequencies) {
          assert.ok(!error, error);
          assert.deepEqual(frequencies, [
            599, 
            1105, 
            373, 
            245997, 
            229, 
            7678, 
            32461, 
            126929, 
            36, 
            223, 
            6, 
            0, 
            45
          ]);
          testDone();
        }
      );
    }
  );

  // TODO: Trending topics.
});
