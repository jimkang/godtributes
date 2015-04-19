var assert = require('assert');
var createExhorter = require('../exhorter');
var jsonfile = require('jsonfile');
var conformAsync = require('conform-async');
var _ = require('lodash');
var tributeDemander = require('../tributedemander');
var sinon = require('sinon');

var utils = {
  mockLastRepliedToLongAgo: function mockLastRepliedToLongAgo(id, cb) {
    // Say user was just replied to long ago.
    conformAsync.callBackOnNextTick(cb, null, new Date('2000-01-01'));
  },
  getDefaultExhorterOpts: function getDefaultExhorterOpts() {
    return {
      chronicler: {
        whenWasUserLastRepliedTo: utils.mockLastRepliedToLongAgo,
        topicWasUsedInReplyToUser:
          function mockTopicWasUsedInReplyToUser(noun, userId, done) {
            conformAsync.callBackOnNextTick(done, null, false);
          },
        topicWasUsedInTribute: function mockTributeUseCheck(noun, done) {
          conformAsync.callBackOnNextTick(done, null, false);
        },
        tweetWasRepliedTo: function mockTweetWasRepliedTo(tweetId, done) {
          conformAsync.callBackOnNextTick(
            done,
            new Error('Key not found in database'),
            false
          );
        }
      },
      behavior: {
        hoursToWaitBetweenRepliesToSameUser: 1,
      },
      logger: console,
      tweetAnalyzer: {
        isTextOKToReplyTo: function mockIsTextOKToReplyTo(tweet) {
          return true;
        }
      },
      nounfinder: {
        getNounsFromText: function mockNounsFromText(text, done) {
          conformAsync.callBackOnNextTick(
            done, null, ['squash', 'pie', 'burger']
          );
        },
        filterNounsForInterestingness: 
          function mockFilter(nouns, maxCommonness, done) {
            conformAsync.callBackOnNextTick(done, null, ['squash', 'burger']);
          }
      },
      tributeDemander: tributeDemander,
      prepPhrasePicker: {
        getPrepPhrase: function mockGetPrepPhrase() {
          return 'FOR THE';
        }
      },
      figurePicker: {
        getMainTributeFigure: function mockGetMainTributeFigure() {
          return 'GOD';
        },
        getSecondaryTributeFigure: function mockGetSecondaryTributeFigure() {
          return 'THRONE';
        }
      },
      decorateWithEmojiOpts: function mockDecorateWithEmojiOpts(opts) {
        return opts;
      },
      maxCommonnessForTopic: 30,
      nounCountThreshold: 2
    };
  },
  getDefaultMockTweet: function getDefaultMockTweet() {
    return {
      id_str: '546402627261833217',     
      user: {
        id: 546402627261833200
      },
      text: 'I turned down for many reasons.'
    };
  },
  createMockNounfinder: function createMockNounfinder(opts) {
    return {
      getNounsFromText: function mockNounsFromText(text, done) {
        conformAsync.callBackOnNextTick(done, null, opts.nounsToBeFound);
      },
      filterNounsForInterestingness: function mockFilter(n, m, done) {
        conformAsync.callBackOnNextTick(
          done, null, opts.interestingNounsToBeFound
        );
      }
    };
  }
};

describe('getExhortationForTweet', function exhortSuite() {
  describe('should not return an exhortation for a tweet that', 
    function disqualificationSuite() {
      it('has a user that has been replied to recently',
        function testRepliedRecently(testDone) {
          var opts = utils.getDefaultExhorterOpts();
          opts.chronicler.whenWasUserLastRepliedTo = 
          function mockLast(id, cb) {
            // Say user was just replied to.
            conformAsync.callBackOnNextTick(cb, null, new Date());
          };

          var exhorter = createExhorter(opts);
          var mockTweet = utils.getDefaultMockTweet();

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'Replied too recently.');
              assert.equal(error.userId, mockTweet.user.id);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('is a retweet of @godtributes', 
        function testRetweet(testDone) {
          var mockTweet = utils.getDefaultMockTweet();
          mockTweet.retweeted_status = {
            user: {
              screen_name: 'godtributes'
            }
          };

          var exhorter = createExhorter(utils.getDefaultExhorterOpts());

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'This is a retweet of myself.');
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('is a tweet of @godtributes', 
        function testSelfTweet(testDone) {
          var mockTweet = utils.getDefaultMockTweet();

          mockTweet.user = {
            screen_name: 'godtributes'
          };

          var exhorter = createExhorter(utils.getDefaultExhorterOpts());

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'This is one of my tweets.');
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('is a manual retweet of @godtributes', 
        function testManualRetweet(testDone) {
          var mockTweet = utils.getDefaultMockTweet();
          mockTweet.text = 'RT @godtributes: "RETWEETS FOR THE RETWEET GOD"';

          var exhorter = createExhorter(utils.getDefaultExhorterOpts());

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'This is a retweet of myself.');
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('contains a not-ok topic', 
        function testNotOKTopicInText(testDone) {
          var mockTweet = utils.getDefaultMockTweet();
          mockTweet.text = 'Mock inappropriate topics go here.';

          var opts = utils.getDefaultExhorterOpts();
          opts.tweetAnalyzer = {
            isTextOKToReplyTo: function mockIsTextOKToReplyTo(tweet) {
              // Simulating there being something wrong with the text.
              return false;
            }
          };
          var exhorter = createExhorter(opts);

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'Contents unsafe to respond to.');
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('has no nouns outside the blacklist', 
        function testNoNouns(testDone) {
          var mockTweet = utils.getDefaultMockTweet();
          mockTweet.text = 'Stop drop roll.';

          var opts = utils.getDefaultExhorterOpts();
          opts.nounfinder = {
            getNounsFromText: function mockNounsFromText(text, done) {
              // Simulating no nouns found.
              conformAsync.callBackOnNextTick(done, null, []);
            }
          };
          var exhorter = createExhorter(opts);

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'No nouns found.');
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );          
        }
      );

      it('has no interesting topics',
        function testNoInterestingTopics(testDone) {
          var mockTweet = utils.getDefaultMockTweet();

          var opts = utils.getDefaultExhorterOpts();
          opts.nounfinder.filterNounsForInterestingness = 
          function mockFilterAllBoring(nouns, maxCommonness, done) {
            conformAsync.callBackOnNextTick(done, null, []);
          };          
          var exhorter = createExhorter(opts);

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'Filtered ALL nouns from text.');
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('has no new topics for the user',
        function testNotNewToUser(testDone) {
          var mockTweet = utils.getDefaultMockTweet();

          var opts = utils.getDefaultExhorterOpts();
          opts.chronicler.topicWasUsedInReplyToUser = 
          function mockTopicWasUsedInReplyToUser(noun, userId, done) {
            // Always say that it was used for this test.
            conformAsync.callBackOnNextTick(done, null, true);
          };
          opts.chronicler.topicWasUsedInTribute = 
            function mockTributeUseCheck(noun, done) {
              conformAsync.callBackOnNextTick(done, null, true);
            };

          var exhorter = createExhorter(opts);

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'No new material for user.');
              assert.equal(error.userId, mockTweet.user.id);
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('has been replied to before',
        function testAlreadyReplied(testDone) {
          var mockTweet = utils.getDefaultMockTweet();

          var opts = utils.getDefaultExhorterOpts();
          opts.chronicler.tweetWasRepliedTo = 
          function mockTweetWasRepliedTo(tweetId, done) {
            // Always say that it was replied to for this test.
            conformAsync.callBackOnNextTick(done, null, true);
          };

          var exhorter = createExhorter(opts);

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message, 'Tweet was already replied to.');
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

      it('the noun threshold is not met after the all the filtering',
        function testNounThresholdNotMet(testDone) {
          var mockTweet = utils.getDefaultMockTweet();

          var opts = utils.getDefaultExhorterOpts();
          opts.nounCountThreshold = 3;
          var exhorter = createExhorter(opts);

          exhorter.getExhortationForTweet(
            mockTweet,
            function checkResult(error, tweet, exhortation) {
              assert.ok(error);
              assert.equal(error.message,
                'There aren\'t enough usable nouns to work with.'
              );
              assert.equal(error.id, mockTweet.id_str);
              assert.equal(error.text, mockTweet.text);
              assert.ok(!exhortation);
              testDone();
            }
          );
        }
      );

    }
  );

  it('should return an exhortation for a worthy tweet',
    function testWorthy(testDone) {
      var mockTweet = utils.getDefaultMockTweet();

      var opts = utils.getDefaultExhorterOpts();
      var emojiDecoratorSpy = sinon.spy(opts, 'decorateWithEmojiOpts');
      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(
        mockTweet,
        function checkResult(error, tweet, exhortation, topics) {
          assert.ok(!error);
          assert.ok(Array.isArray(topics));
          assert.ok(exhortation);
          assert.ok(emojiDecoratorSpy.calledTwice);
          opts.decorateWithEmojiOpts.restore();
          testDone();
        }
      );
    }
  );

  it('replies to a tweet in that language', 
    function testManualRetweet(testDone) {
      var mockTweet = utils.getDefaultMockTweet();
      // This test is a little deceptive. The mock tweet is in Spanish to 
      // trigger the translation of the exhortation, but the content of the 
      // exhortation will come from the mock nounfinder, which will say 
      // the nouns are squash and burger.
      mockTweet.text = '!El tren es grande!';
      mockTweet.user = {
        screen_name: 'smidgeo',
        id: 1234
      };

      var exhorter = createExhorter(utils.getDefaultExhorterOpts());

      exhorter.getExhortationForTweet(
        mockTweet,
        function checkResult(error, tweet, exhortation) {
          if (error) {
            console.log(error.message);
          }
          assert.ok(!error);
          assert.equal(
            exhortation,
            '@smidgeo HAMBURGUESAS PARA EL DIOS DE LA HAMBURGUESA! CALABAZAS PARA EL TRONO DE SQUASH'
          );
          testDone();
        }
      );
    }
  );

  it('replies to a tweet in Spanish',
    function testSpanish(testDone) {
      var mockTweet = utils.getDefaultMockTweet();
      // This test is a little deceptive. The mock tweet is in Spanish to 
      // trigger the translation of the exhortation, but the content of the 
      // exhortation will come from the mock nounfinder, which will say 
      // the nouns are squash and burger.
      mockTweet.text = 'Si la falta de tiempo te ha orillado a buscar una pareja en el mundo virtual, hoy hay quien lo hace por ti. #6Grados http://voxit.me/L7do';
      mockTweet.user = {
        screen_name: 'smidgeo',
        id: 1234
      };

      var opts = utils.getDefaultExhorterOpts();

      opts.nounfinder = utils.createMockNounfinder({
        nounsToBeFound: ['hoy', 'quien'],
        interestingNounsToBeFound: ['hoy', 'quien']
      });

      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(
        mockTweet,
        function checkResult(error, tweet, exhortation) {
          if (error) {
            console.log(error.message);
          }
          assert.ok(!error);
          assert.equal(
            exhortation,
            '@smidgeo HOYS PARA EL DIOS HOY! QUIENS POR EL TRONO DE QUIEN'
          );
          testDone();
        }
      );
    }
  );

  it('replies to a tweet in French',
    function testFrench(testDone) {
      var mockTweet = utils.getDefaultMockTweet();
      // This test is a little deceptive. The mock tweet is in Spanish to 
      // trigger the translation of the exhortation, but the content of the 
      // exhortation will come from the mock nounfinder, which will say 
      // the nouns are squash and burger.
      mockTweet.text = 'Homme #Scorpion + Femme #Verseau = elle est assez tentée par une aventure avec lui, mais sa jalousie risque de l\'effrayer. Entente : 2/5.';
      mockTweet.user = {
        screen_name: 'smidgeo',
        id: 1234
      };

      var opts = utils.getDefaultExhorterOpts();

      opts.nounfinder = utils.createMockNounfinder({
        nounsToBeFound: ['jalousie', 'aventure'],
        interestingNounsToBeFound: ['jalousie', 'aventure']
      });

      var exhorter = createExhorter(opts);

      exhorter.getExhortationForTweet(
        mockTweet,
        function checkResult(error, tweet, exhortation) {
          if (error) {
            console.log(error.message);
          }
          assert.ok(!error);
          assert.equal(
            exhortation,
            '@smidgeo STORES POUR LA JALOUSIE DE DIEU ! AVENTURES POUR LE TRÔNE DE L\'AVENTURE'
          );
          testDone();
        }
      );
    }
  );

});
