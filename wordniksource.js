var request = require('request');
var apiKey = require('./config').wordnikAPIKey;
var _ = require('lodash');
var queue = require('queue-async');

var randomWordURL = 'http://api.wordnik.com:80/v4/words.json/randomWord?' +
  'hasDictionaryDef=false&' + 
  'includePartOfSpeech=noun&' +
  'excludePartOfSpeech=proper-noun&' + 
  'minCorpusCount=0&maxCorpusCount=-1' + 
  '&minDictionaryCount=1&maxDictionaryCount=-1&' + 
  'minLength=2&maxLength=120&' +
  'api_key=' + apiKey;


var partOfSpeechURLPrefix = 'http://api.wordnik.com:80/v4/word.json/';
var partOfSpeechURLPostfix = '/definitions?' + 
  'limit=4&' +
  'includeRelated=false&' + 
  'useCanonical=false&' + 
  'includeTags=false&' + 
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

  function getPartOfSpeech(word, done) {
    var url = partOfSpeechURLPrefix + encodeURIComponent(word) + 
      partOfSpeechURLPostfix;
    request(url, function parseReply(error, response, body) {
      if (error) {
        done(error);
      }
      else {
        // TODO: Validate JSON.
        var parsed = JSON.parse(body);
        var partOfSpeech = null;
        var partsFound = _.compact(_.pluck(parsed, 'partOfSpeech'));
        // Use the first part of speech returned, if any were returned.
        if (partsFound.length > 0) {
          partOfSpeech = partsFound[0];
        }
        done(error, partOfSpeech);
      }
    });
  }

  function getPartsOfSpeech(words, done) {
    var q = queue();
    words.forEach(function addToQueue(word) {
      q.defer(getPartOfSpeech, word);
    });
    q.awaitAll(done);
  }

  return {
    getTopic: getTopic,
    getPartOfSpeech: getPartOfSpeech,
    getPartsOfSpeech: getPartsOfSpeech
  };
}

module.exports = createSource;
