var assert = require('assert');
var recordkeeper = require('../recordkeeper');
var idmaker = require('idmaker');

suite('recordkeeper', function recordkeeperSuite() {

  test('Not replying to the same tweets.', 
    function testRecordAndCheckReply(testDone) {
      var tweetId = idmaker.randomId(18);
      var userId = idmaker.randomId(9);

      recordkeeper.tweetWasRepliedTo(tweetId, function done(error, replied) {
        assert.ok(!error);
        assert.ok(!replied);

        recordkeeper.recordThatTweetWasRepliedTo(tweetId);

        setTimeout(function checkReplyAgain() {
          recordkeeper.tweetWasRepliedTo(tweetId, function done(error, replied) {
            assert.ok(!error);
            assert.ok(replied);
            testDone();
          });
        },
        0);
      });
    }
  );

  test('Finding out when the user was last replied to', 
    function testRecordReplyDate(testDone) {
      var tweetId = idmaker.randomId(18);
      var userId = idmaker.randomId(9);

      recordkeeper.whenWasUserLastRepliedTo(userId, function done(error, date) {
        assert.ok(error.notFound);
        assert.equal(date, null);

        recordkeeper.recordThatUserWasRepliedTo(userId);

        function checkDateAgain() {
          recordkeeper.whenWasUserLastRepliedTo(userId, 
            function done(error, date) {
              assert.ok(!error);
              assert.equal(Object.prototype.toString.call(date), 
                '[object Date]'
              );
              testDone();
            }
          );
        }

        setTimeout(checkDateAgain, 0);
      });
    }
  );

  // TODO: Test upper and lowercase stuff.

  // Note: This entire suite must be run together. Individual tests within it 
  // will not work.
  suite('Find out if this topic was tweeted at a user', 
    function alreadySaidSuite() {
      var userAId = idmaker.randomId(9);
      var userBId = idmaker.randomId(9);
      var topic = 'smidgeo';

      test('verify topic that hasn\'t been tweeted to User A is reported as such', 
        function testNotTweeted(testDone) {

        recordkeeper.topicWasUsedInReplyToUser(topic, userAId, 
          function done(error, wasUsed) {
            assert.ok(!error);
            debugger;
            assert.ok(!wasUsed);
            testDone();
          }
        );
      });

      test('verify topic that hasn\'t been tweeted to User B is reported as such', 
        function testNotTweeted(testDone) {

        recordkeeper.topicWasUsedInReplyToUser(topic, userBId, 
          function done(error, wasUsed) {
            assert.ok(!error);
            assert.ok(!wasUsed);
            testDone();
          }
        );
      });

      test('record that topic was tweeted to User B', 
        function testRecord(testDone) {
          recordkeeper.recordThatTopicWasUsedInReplyToUser(topic, userBId);

          function verifyRecording() {
            recordkeeper.topicWasUsedInReplyToUser(topic, userBId, 
              checkTopicUseForUserB);
          }

          function checkTopicUseForUserB(error, wasUsed) {
            assert.ok(!error);
            assert.ok(wasUsed, 
              'recordkeeper erroneously reported that this topic was not tweeted at this user.'
            );
            recordkeeper.topicWasUsedInReplyToUser(topic, userAId, 
              checkTopicUseForUserA);
          }

          function checkTopicUseForUserA(error, wasUsed) {
            assert.ok(!error);
            assert.ok(!wasUsed);
            testDone();
          }

          setTimeout(verifyRecording, 0);
        }
      );
    }
  );

  suite('Find out if this topic was tweeted as a main tribute', 
    function alreadyTweetedSuite() {
      var uppercasetopic = 'DRWILY' + idmaker.randomId(8);
      var lowercaseTopic = uppercasetopic.toLowerCase();

      test('verify topic that hasn\'t been tweeted is reported as such', 
        function testNotTweeted(testDone) {

        recordkeeper.topicWasUsedInTribute(lowercaseTopic, 
          function done(error, wasUsed) {
            assert.ok(!error);
            assert.ok(!wasUsed);
            testDone();
          }
        );
      });

      test('record that topic was tweeted in tribute (record in uppercase, search in lower)',
        function testRecord(testDone) {
          recordkeeper.recordThatTopicWasUsedInTribute(uppercasetopic);

          setTimeout(verifyRecording, 0);

          function verifyRecording() {
            recordkeeper.topicWasUsedInTribute(lowercaseTopic, checkTopicUse);
          }

          function checkTopicUse(error, wasUsed) {
            assert.ok(!error);
            assert.ok(wasUsed, 
              'recordkeeper erroneously reported that this topic was not tweeted in a tribute.'
            );
            testDone();
          }          
        }
      );
    }
  );

});
