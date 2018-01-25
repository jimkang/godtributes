/* global it describe */

var assert = require('assert');
var createExhorter = require('../exhorter');
var callNextTick = require('call-next-tick');
var sinon = require('sinon');
var exhorterMocks = require('./fixtures/exhorter-mocks');

describe('getExhortationForTweet', function exhortSuite() {
  describe('should not return an exhortation for a tweet that', function disqualificationSuite() {
    it('has a user that has been replied to recently', function testRepliedRecently(
      testDone
    ) {
      var opts = exhorterMocks.getDefaultExhorterOpts();
      opts.chronicler.whenWasUserLastRepliedTo = function mockLast(id, cb) {
        // Say user was just replied to.
        callNextTick(cb, null, new Date());
      };

      var exhorter = createExhorter(opts);
      var mockTweet = exhorterMocks.getDefaultMockTweet();

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'Replied too recently.');
        assert.equal(error.screen_name, mockTweet.user.screen_name);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('is a retweet of @godtributes', function testRetweet(testDone) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();
      mockTweet.retweeted_status = {
        user: {
          screen_name: 'godtributes'
        }
      };

      var exhorter = createExhorter(exhorterMocks.getDefaultExhorterOpts());

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'This is a retweet of myself.');
        assert.equal(error.id, mockTweet.id_str);
        // assert.ok(error.time, 'Time exists in error.');
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('is a tweet of @godtributes', function testSelfTweet(testDone) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();

      mockTweet.user = {
        screen_name: 'godtributes'
      };

      var exhorter = createExhorter(exhorterMocks.getDefaultExhorterOpts());

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'This is one of my tweets.');
        assert.equal(error.id, mockTweet.id_str);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('is a manual retweet of @godtributes', function testManualRetweet(
      testDone
    ) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();
      mockTweet.text = 'RT @godtributes: "RETWEETS FOR THE RETWEET GOD"';

      var exhorter = createExhorter(exhorterMocks.getDefaultExhorterOpts());

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'This is a retweet of myself.');
        assert.equal(error.id, mockTweet.id_str);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('contains a not-ok topic', function testNotOKTopicInText(testDone) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();
      mockTweet.text = 'Mock inappropriate topics go here.';

      var opts = exhorterMocks.getDefaultExhorterOpts();
      opts.canIChimeIn = function mockIsOKToChimeIn() {
        // Simulating there being something wrong with the text.
        return false;
      };
      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'Contents unsafe to respond to.');
        assert.equal(error.id, mockTweet.id_str);
        assert.equal(error.text, mockTweet.text);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('has no nouns outside the blacklist', function testNoNouns(testDone) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();
      mockTweet.text = 'Stop drop roll.';

      var opts = exhorterMocks.getDefaultExhorterOpts();
      opts.nounfinder = {
        getNounsFromText: function mockNounsFromText(text, done) {
          // Simulating no nouns found.
          callNextTick(done, null, []);
        }
      };
      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'No nouns found.');
        assert.equal(error.id, mockTweet.id_str);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('has no interesting topics', function testNoInterestingTopics(testDone) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();

      var opts = exhorterMocks.getDefaultExhorterOpts();
      opts.nounfinder.filterNounsForInterestingness = function mockFilterAllBoring(
        nouns,
        maxCommonness,
        done
      ) {
        callNextTick(done, null, []);
      };
      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'Filtered ALL nouns from text.');
        assert.equal(error.id, mockTweet.id_str);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('has no new topics for the user', function testNotNewToUser(testDone) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();

      var opts = exhorterMocks.getDefaultExhorterOpts();
      opts.chronicler.topicWasUsedInReplyToUser = function mockTopicWasUsedInReplyToUser(
        noun,
        userId,
        done
      ) {
        // Always say that it was used for this test.
        callNextTick(done, null, true);
      };
      opts.chronicler.topicWasUsedInTribute = function mockTributeUseCheck(
        noun,
        done
      ) {
        callNextTick(done, null, true);
      };

      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'No new material for user.');
        assert.equal(error.userId, mockTweet.user.id);
        assert.equal(error.id, mockTweet.id_str);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('has been replied to before', function testAlreadyReplied(testDone) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();

      var opts = exhorterMocks.getDefaultExhorterOpts();
      opts.chronicler.tweetWasRepliedTo = function mockTweetWasRepliedTo(
        tweetId,
        done
      ) {
        // Always say that it was replied to for this test.
        callNextTick(done, null, true);
      };

      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(error.message, 'Tweet was already replied to.');
        assert.equal(error.id, mockTweet.id_str);
        assert.ok(!exhortation);
        testDone();
      });
    });

    it('the noun threshold is not met after the all the filtering', function testNounThresholdNotMet(
      testDone
    ) {
      var mockTweet = exhorterMocks.getDefaultMockTweet();

      var opts = exhorterMocks.getDefaultExhorterOpts();
      opts.nounCountThreshold = 3;
      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(mockTweet, function checkResult(
        error,
        tweet,
        exhortation
      ) {
        assert.ok(error);
        assert.equal(
          error.message,
          "There aren't enough usable nouns to work with."
        );
        assert.equal(error.id, mockTweet.id_str);
        assert.ok(!exhortation);
        testDone();
      });
    });
  });

  it('should return an exhortation for a worthy tweet', function testWorthy(
    testDone
  ) {
    var mockTweet = exhorterMocks.getDefaultMockTweet();

    var opts = exhorterMocks.getDefaultExhorterOpts();
    var emojiDecoratorSpy = sinon.spy(opts, 'decorateWithEmojiOpts');
    var exhorter = createExhorter(opts);

    exhorter.getExhortationForTweet(mockTweet, function checkResult(
      error,
      tweet,
      exhortation,
      topics
    ) {
      assert.ok(!error);
      assert.ok(Array.isArray(topics));
      assert.ok(exhortation);
      assert.ok(emojiDecoratorSpy.calledTwice);
      opts.decorateWithEmojiOpts.restore();
      testDone();
    });
  });

  it('replies to a tweet in that language', function testManualRetweet(
    testDone
  ) {
    var mockTweet = exhorterMocks.getDefaultMockTweet();
    // This test is a little deceptive. The mock tweet is in Spanish to
    // trigger the translation of the exhortation, but the content of the
    // exhortation will come from the mock nounfinder, which will say
    // the nouns are squash and burger.
    mockTweet.text = '!El tren es grande!';
    mockTweet.lang = 'es';
    mockTweet.user = {
      screen_name: 'smidgeo',
      id: 1234
    };

    var exhorter = createExhorter(exhorterMocks.getDefaultExhorterOpts());

    exhorter.getExhortationForTweet(mockTweet, function checkResult(
      error,
      tweet,
      exhortation
    ) {
      if (error) {
        console.log(error.message);
      }
      assert.ok(!error);
      assert.equal(
        exhortation,
        '@smidgeo ¡HAMBURGUESAS BURGER DIOS! CALABAZAS PARA EL TRONO DE SQUASH'
      );
      testDone();
    });
  });

  it('replies to a tweet in Spanish', function testSpanish(testDone) {
    var mockTweet = exhorterMocks.getDefaultMockTweet();
    // This test is a little deceptive. The mock tweet is in Spanish to
    // trigger the translation of the exhortation, but the content of the
    // exhortation will come from the mock nounfinder, which will say
    // the nouns are squash and burger.
    mockTweet.text =
      'Si la falta de tiempo te ha orillado a buscar una pareja en el mundo virtual, hoy hay quien lo hace por ti. #6Grados http://voxit.me/L7do';
    mockTweet.lang = 'es';
    mockTweet.user = {
      screen_name: 'smidgeo',
      id: 1234
    };

    var opts = exhorterMocks.getDefaultExhorterOpts();

    opts.nounfinder = exhorterMocks.createMockNounfinder({
      nounsToBeFound: ['hoy', 'quien'],
      interestingNounsToBeFound: ['hoy', 'quien']
    });

    var exhorter = createExhorter(opts);

    exhorter.getExhortationForTweet(mockTweet, function checkResult(
      error,
      tweet,
      exhortation
    ) {
      assert.equal(
        exhortation,
        '@smidgeo ¡QUIENS PARA EL DIOS DE QUIEN! HOYS POR EL TRONO DE HOY'
      );
      testDone();
    });
  });

  it('replies to a tweet in French', function testFrench(testDone) {
    var mockTweet = exhorterMocks.getDefaultMockTweet();
    // This test is a little deceptive. The mock tweet is in Spanish to
    // trigger the translation of the exhortation, but the content of the
    // exhortation will come from the mock nounfinder, which will say
    // the nouns are squash and burger.
    mockTweet.text =
      "Homme #Scorpion + Femme #Verseau = elle est assez tentée par une aventure avec lui, mais sa jalousie risque de l'effrayer. Entente : 2/5.";
    mockTweet.lang = 'fr';
    mockTweet.user = {
      screen_name: 'smidgeo',
      id: 1234
    };

    var opts = exhorterMocks.getDefaultExhorterOpts();

    opts.nounfinder = exhorterMocks.createMockNounfinder({
      nounsToBeFound: ['jalousie', 'aventure'],
      interestingNounsToBeFound: ['jalousie', 'aventure']
    });

    var exhorter = createExhorter(opts);

    exhorter.getExhortationForTweet(mockTweet, function checkResult(
      error,
      tweet,
      exhortation
    ) {
      assert.equal(
        exhortation,
        '@smidgeo STORES POUR LA JALOUSIE DE DIEU ! AVENTURES POUR LE TRÔNE DE L’AVENTURE'
      );
      testDone();
    });
  });

  it("does not misidentify a short tweet's language", function testFalsePositive(
    testDone
  ) {
    var mockTweet = exhorterMocks.getDefaultMockTweet();
    // This test is a little deceptive. The mock tweet is in Spanish to
    // trigger the translation of the exhortation, but the content of the
    // exhortation will come from the mock nounfinder, which will say
    // the nouns are squash and burger.
    mockTweet.text = 'FUS RO DAH';
    mockTweet.lang = 'en';
    mockTweet.user = {
      screen_name: 'smidgeo',
      id: 1234
    };

    var opts = exhorterMocks.getDefaultExhorterOpts();

    opts.nounfinder = exhorterMocks.createMockNounfinder({
      nounsToBeFound: ['fus', 'dah'],
      interestingNounsToBeFound: ['fus', 'dah']
    });

    var exhorter = createExhorter(opts);

    exhorter.getExhortationForTweet(mockTweet, function checkResult(
      error,
      tweet,
      exhortation
    ) {
      if (error) {
        console.log(error.message);
      }
      assert.ok(!error);
      assert.equal(
        exhortation,
        '@smidgeo FUSES FOR THE FUS GOD! DAHS FOR THE DAH THRONE'
      );
      testDone();
    });
  });

  it('does not misidentify a blatantly English tweet', function testFalsePositive2(
    testDone
  ) {
    var mockTweet = exhorterMocks.getDefaultMockTweet();
    mockTweet.text =
      'Buzzfeed internal review finds 3 posts deleted due to advertiser pressure: http://mobile.nytimes.com/2015/04/20/business/media/buzzfeed-says-posts-were-deleted-because-of-advertising-pressure.html?referrer= … via @babiejenks';
    mockTweet.lang = 'en';
    mockTweet.user = {
      screen_name: 'smidgeo',
      id: 1234
    };

    var opts = exhorterMocks.getDefaultExhorterOpts();
    opts.nounfinder = exhorterMocks.createMockNounfinder({
      nounsToBeFound: ['advertiser', 'pressure'],
      interestingNounsToBeFound: ['advertiser', 'pressure']
    });

    var exhorter = createExhorter(opts);

    exhorter.getExhortationForTweet(mockTweet, function checkResult(
      error,
      tweet,
      exhortation
    ) {
      if (error) {
        console.log(error.message);
      }
      assert.ok(!error);
      assert.equal(
        exhortation,
        '@smidgeo ADVERTISERS FOR THE ADVERTISER GOD! PRESSURES FOR THE PRESSURE THRONE'
      );
      testDone();
    });
  });

  it('handles unknown language error', function testTranslationError(testDone) {
    var mockTweet = exhorterMocks.getDefaultMockTweet();
    mockTweet.text = '👆🏽';
    mockTweet.lang = 'esdf';
    mockTweet.user = {
      screen_name: 'smidgeo',
      id: 1234
    };

    var opts = exhorterMocks.getDefaultExhorterOpts();
    opts.nounfinder = exhorterMocks.createMockNounfinder({
      nounsToBeFound: ['👆', '🏽'],
      interestingNounsToBeFound: ['👆', '🏽']
    });

    var exhorter = createExhorter(opts);

    exhorter.getExhortationForTweet(mockTweet, function checkResult(
      error,
      tweet,
      exhortation
    ) {
      if (error) {
        console.log(error.message);
      }
      assert.ok(!error);
      assert.equal(
        exhortation,
        '@smidgeo 🏽S FOR THE 🏽 GOD! 👆S FOR THE 👆 THRONE'
      );
      testDone();
    });
  });
});
