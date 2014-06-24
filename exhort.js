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
    debugger;
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
      console.log('nouns', nouns);
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
          debugger;
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
