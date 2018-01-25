var test = require('tape');
var _ = require('lodash');
var callNextTick = require('call-next-tick');
var createExhorter = require('../exhorter');
var exampleImageTweetBase = require('./fixtures/example-image-tweet.js');
var imageAPIResponses = require('./fixtures/google-image-api-responses.js');
var exhorterMocks = require('./fixtures/exhorter-mocks');

test('Exhortation from image', function imageExhortationTest(t) {
  var mockTweet = _.cloneDeep(exampleImageTweetBase);

  var opts = exhorterMocks.getDefaultExhorterOpts();
  opts.maxCommonnessForImageTopic = 501;
  opts.nounfinder.getNounsFromText = function mockNounsFromText() {
    t.fail('getNounsFromText is not called.');
  };

  opts.nounfinder.filterNounsForInterestingness = function mockFilter(
    nouns,
    maxCommonness,
    done
  ) {
    t.equal(
      maxCommonness,
      opts.maxCommonnessForImageTopic,
      'opts.maxCommonnessForImageTopic is passed to filterNounsForInterestingness.'
    );
    callNextTick(done, null, nouns);
  };

  opts.getImageAnalysis = function mockGetImageAnalysis(opts, done) {
    callNextTick(done, null, imageAPIResponses.wormDrawing);
  };

  opts.probable = {
    roll: function mockRoll() {
      return 1;
    },
    shuffle: function badShuffle(array) {
      return array.reverse();
    }
  };

  var exhorter = createExhorter(opts);

  exhorter.getExhortationForTweet(mockTweet, checkResult);

  function checkResult(error, tweet, exhortation, topics) {
    t.ok(!error, 'No error while getting exhortation.');
    t.deepEqual(
      topics,
      ['emblem', 'invertebrate'],
      'Expected topics extracted.'
    );
    t.equal(
      exhortation,
      '@deathmtn EMBLEMS FOR THE EMBLEM GOD! INVERTEBRATES FOR THE INVERTEBRATE THRONE',
      'Exhortation is correct.'
    );
    t.end();
  }
});
