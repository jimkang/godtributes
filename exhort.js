// var Bot = require('./node_modules/twit/examples/bot');
var Twit = require('twit');
var config = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');
var probable = require('probable');
var _ = require('lodash');

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
  function readStatuses(error, response) {
    var notGodTributesRTs = response.filter(isNotARetweetOfSelf);
    var nonReplies = notGodTributesRTs.filter(isNotAReply);
    // console.log(nonReplies)
    var filteredTexts = _.pluck(nonReplies, 'text');
    console.log(filteredTexts);
    filteredTexts.forEach(getReplyNounsFromText);
  });
}

function getReplyNounsFromText(text) {
  console.log('Looking for nouns from:', text)
  getNounsFromText(text, function done(error, nouns) {
    if (error) {
      console.log(error);
    }
    else {
      // console.log('nouns', nouns);
      if (nouns.length > 0) {
        filterNounsForIntererstingness(nouns, function done(error, filtered) {
          if (error) {
            console.log(error);
          }
          else {
            console.log('Filtered nouns:', filtered);
          }
        });
      }
    }
  });
}

function isNotAReply(status) {
  return !status.in_reply_to_user_id && !status.in_reply_to_status_id && 
    !status.in_reply_to_screen_name;
}

function isNotARetweetOfSelf(status) {
  var isNotRTOfSelf = !status.retweeted_status || 
    status.retweeted_status.user.screen_name !== 'godtributes';
  if (!isNotRTOfSelf) {
    console.log('Found RT of self:', status.text);
  }
  return isNotRTOfSelf;
}

function getNounsFromText(text, done) {
  var words = text.split(/[ ":]/);
  words = _.compact(words);
  if (words.length > 0) {
    var filteredWords = words.filter(isWorthCheckingForNounHood);
    wordniksource.getPartsOfSpeech(filteredWords, 
      function filterToNouns(error, partsOfSpeech) {
        if (error) {
          done(error);
        }
        else {
          var nouns = [];
          partsOfSpeech.forEach(function addIfNoun(part, i) {
            if (part === 'noun') {
              nouns.push(filteredWords[i]);
            }
          });
          done(error, nouns);
        }
      }
    );
  }
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

function isWorthCheckingForNounHood(word) {
  return word !== 'a' && word !== 'A' && wordDoesNotStartWithAtSymbol(word);
}

function shouldReplyToUser() {
  return probable.roll(5) === 0;
}

function handleError(error) {
  console.error('Response status:', error.statusCode);
  console.error('Data:', error.data);
}

exhort();
