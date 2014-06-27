// var Bot = require('./node_modules/twit/examples/bot');
var Twit = require('twit');
var config = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');
var probable = require('probable');
var _ = require('lodash');
var queue = require('queue-async');

var twit = new Twit(config.twitter);
var wordniksource = createWordnikSource();

console.log('Exhort is running.');

function exhort() {
  twit.get('followers/ids', function exhortFollowers(error, response) {
    if (error) {
      handleError(error);
    }
    else {
      // console.log(response);
      var usersToExhort = response.ids.filter(shouldReplyToUser);
      console.log(usersToExhort);
      usersToExhort.forEach(exhortUser);
    }
  });

  // wordnikSource.getTopic(function postOnTopic(error, topic) {
  //   if (error) {
  //     handleError(error);
  //   }
  //   else {
  //     bot.tweet(tributeDemander.makeDemandForTopic(topic), 
  //       function reportTweetResult(error, reply) {
  //         console.log((new Date()).toString(), 'Tweet posted:', reply.text);
  //       }
  //     );
  //   }
  // });  
}

function exhortUser(userId) {
  twit.get('statuses/user_timeline/:user_id', {
    user_id: userId
  },
  tweetRepliesToStatuses);
}

function tweetRepliesToStatuses(error, response) {
  var notGodTributesRTs = response.filter(isNotARetweetOfSelf);
  var nonReplies = notGodTributesRTs.filter(isNotAReply);
  // console.log(nonReplies)
  // var filteredTexts = _.pluck(nonReplies, 'text');
  // console.log(filteredTexts);
  // filteredTexts.forEach(getReplyNounsFromText);
  filterStatusesForInterestingNouns(nonReplies, 
    function useNounsToReply(error, nounGroups) {
      if (error) {
        console.log(error);
      }
      else {
        nounGroups.forEach(function replyIfTheresEnoughMaterial(nounGroup, i) {
          if (nounGroup.length > 0) {
            replyToStatusWithNouns(nonReplies[i], nounGroup);
          }
        });
      }
    }
  );
}

function filterStatusesForInterestingNouns(statuses, done) {
  var texts = _.pluck(statuses, 'text');
  var q = queue();
  texts.forEach(function addToQueue(text) {
    q.defer(getReplyNounsFromText, text);
  });
  q.awaitAll(done);
}

function replyToStatusWithNouns(status, nouns) {
  console.log('Replying to status', status.text, 'with nouns:', nouns);
}

function getReplyNounsFromText(text, done) {
  console.log('Looking for nouns from:', text);
  getNounsFromText(text, function filterReplyNouns(error, nouns) {
    if (error) {
      console.log(error);
    }
    else {
      console.log('nouns', nouns);
      if (nouns.length > 0) {
        filterNounsForIntererstingness(nouns, function filterDone(error, filtered) {
          if (!error) {
            console.log('Filtered nouns:', filtered);
          }
          done(error, filtered);
        });
      }
      else {
        done(null, []);
      }
    }
  });
}

function isNotAReply(status) {
  return !status.in_reply_to_user_id && !status.in_reply_to_status_id && 
    !status.in_reply_to_screen_name;
}

function isNotARetweetOfSelf(status) {
  var isRTOfSelf = 
    (status.retweeted_status && 
     status.retweeted_status.user.screen_name === 'godtributes') ||
    status.text.indexOf('RT @godtributes') !== -1 ||
    status.text.indexOf('"@godtributes') !== -1 ||
    status.text.indexOf('\u201C@godtributes') !== -1;
    
  if (isRTOfSelf) {
    console.log('Found RT of self:', status.text);
  }
  return !isRTOfSelf;
}

function getNounsFromText(text, done) {
  var words = worthwhileWordsFromText(text);
  wordniksource.getPartsOfSpeech(
    words, 
    function filterToNouns(error, partsOfSpeech) {
      if (error) {
        done(error);
      }
      else {
        var nouns = words.filter(function isNoun(word, i) {
          return (partsOfSpeech[i] === 'noun');
        });
        done(error, nouns);
      }
    }
  );
}

function worthwhileWordsFromText(text) {
  var words = text.split(/[ ":]/);
  var filteredWords = [];
  words = _.compact(words);
  if (words.length > 0) {
    filteredWords = words.filter(isWorthCheckingForNounHood);
  }
  return filteredWords;
}

function filterNounsForIntererstingness(nouns, done) {
  var maxFrequency = 34;
  var interestingNouns = [];
  wordniksource.getWordFrequencies(nouns, 
    function filterByFrequency(error, frequencies) {
      if (error) {
        done(error, interestingNouns);
      }
      else {
        frequencies.forEach(function addNounIfFreqIsUnderMax(freq, i) {
          if (freq < maxFrequency) {
            interestingNouns.push(nouns[i]);
          }
        });
        done(null, interestingNouns);
      }
    }
  );
}

function wordDoesNotStartWithAtSymbol(word) {
  return word.indexOf('@') === -1;
}

function wordIsNotANumeral(word) {
  return isNaN(+word);
}

function isWorthCheckingForNounHood(word) {
  return word !== 'a' && word !== 'A' && wordDoesNotStartWithAtSymbol(word) &&
    wordIsNotANumeral(word);
}

function shouldReplyToUser() {
  return true;
  // return probable.roll(5) === 0;
}

function handleError(error) {
  console.error('Response status:', error.statusCode);
  console.error('Data:', error.data);
}

exhort();
