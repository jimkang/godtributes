var createProbable = require('probable').createProbable;
var seedrandom = require('seedrandom');
var tributeDemander = require('../../tributedemander');
var callNextTick = require('call-next-tick');

var predictableProbable = createProbable({
  random: seedrandom('test')
});

var utils = {
  mockLastRepliedToLongAgo: function mockLastRepliedToLongAgo(id, cb) {
    // Say user was just replied to long ago.
    callNextTick(cb, null, new Date('2000-01-01'));
  },
  getDefaultExhorterOpts: function getDefaultExhorterOpts() {
    return {
      probable: predictableProbable,
      chronicler: {
        whenWasUserLastRepliedTo: utils.mockLastRepliedToLongAgo,
        topicWasUsedInReplyToUser:
          function mockTopicWasUsedInReplyToUser(noun, userId, done) {
            callNextTick(done, null, false);
          },
        topicWasUsedInTribute: function mockTributeUseCheck(noun, done) {
          callNextTick(done, null, false);
        },
        tweetWasRepliedTo: function mockTweetWasRepliedTo(tweetId, done) {
          callNextTick(
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
      canIChimeIn: function mockCanIChimeIn(text) {
        return true;
      },
      nounfinder: {
        getNounsFromText: function mockNounsFromText(text, done) {
          callNextTick(
            done, null, ['squash', 'pie', 'burger']
          );
        },
        filterNounsForInterestingness: 
          function mockFilter(nouns, maxCommonness, done) {
            callNextTick(done, null, ['squash', 'burger']);
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
        id: 546402627261833200,
        screen_name: 'not_lil_jon'
      },
      text: 'I turned down for many reasons.',
      time: (new Date()).toISOString()
    };
  },
  createMockNounfinder: function createMockNounfinder(opts) {
    return {
      getNounsFromText: function mockNounsFromText(text, done) {
        callNextTick(done, null, opts.nounsToBeFound);
      },
      filterNounsForInterestingness: function mockFilter(n, m, done) {
        callNextTick(
          done, null, opts.interestingNounsToBeFound
        );
      }
    };
  }
};

module.exports = utils;
