var assert = require('assert');
var createExhorter = require('../exhorter');
var jsonfile = require('jsonfile');
var conformAsync = require('conform-async');
var _ = require('lodash');

var utils = {
	mockLastRepliedToLongAgo: function mockLastRepliedToLongAgo(id, cb) {
		// Say user was just replied to long ago.
		conformAsync.callBackOnNextTick(cb, null, new Date('2000-01-01'));
	},
	getDefaultExhorterOpts: function getDefaultExhorterOpts() {
		return {
			chronicler: {
				whenWasUserLastRepliedTo: utils.mockLastRepliedToLongAgo
			},
			behavior: {
				hoursToWaitBetweenRepliesToSameUser: 1
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
						debugger;
    				conformAsync.callBackOnNextTick(done, null, ['squash', 'burger']);
    			}
			}
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
	}
};

describe('exhortationForTweet', function exhortSuite() {
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

      		exhorter.exhortationForTweet(
      			mockTweet,
	      		function checkResult(error, exhortation) {
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

      		exhorter.exhortationForTweet(
      			mockTweet,
	      		function checkResult(error, exhortation) {
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

      it('is a manual retweet of @godtributes', 
      	function testManualRetweet(testDone) {
      		var mockTweet = utils.getDefaultMockTweet();
    			mockTweet.text = 'RT @godtributes: "RETWEETS FOR THE RETWEET GOD"';

      		var exhorter = createExhorter(utils.getDefaultExhorterOpts());

      		exhorter.exhortationForTweet(
      			mockTweet,
	      		function checkResult(error, exhortation) {
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

      		exhorter.exhortationForTweet(
      			mockTweet,
	      		function checkResult(error, exhortation) {
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

      		exhorter.exhortationForTweet(
      			mockTweet,
	      		function checkResult(error, exhortation) {
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

      		exhorter.exhortationForTweet(
      			mockTweet,
	      		function checkResult(error, exhortation) {
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

      		exhorter.exhortationForTweet(
      			mockTweet,
	      		function checkResult(error, exhortation) {
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
    }
  );

  it('should return an exhortation for a worthy tweet');
});
