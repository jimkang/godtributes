var request = require('request');
var apiKey = require('./config').wordnikAPIKey;

var randomWordURL = 'http://api.wordnik.com:80/v4/words.json/randomWord?' +
  'hasDictionaryDef=false&' + 
  'includePartOfSpeech=noun&' +
  'excludePartOfSpeech=proper-noun&' + 
  'minCorpusCount=0&maxCorpusCount=-1' + 
  '&minDictionaryCount=1&maxDictionaryCount=-1&' + 
  'minLength=2&maxLength=120&' +
  'api_key=' + apiKey;

var buzzkillBlacklist = [
  'Negro',
  'Negroes',
  'chink',
  'chinks',
  'gook',
  'gooks',
  'nigger',
  'niggers',
  'spic',
  'spics',
  'rape',
  'rapes',
  'rapist',
  'rapists'
];

function createSource() {
  function getTopic(done) {
    request(randomWordURL, function parseWordnikReply(error, response, body) {
      debugger;
      if (error) {
        done(error);
      }
      else {
        var parsed = JSON.parse(body);
        if (buzzkillBlacklist.indexOf(parsed.word) === -1) {
          done(error, parsed.word);
        }
        else {
          // Try again.
          getTopic(done);
        }
      }
    });
  }

  return {
    getTopic: getTopic
  };
}

module.exports = createSource;
