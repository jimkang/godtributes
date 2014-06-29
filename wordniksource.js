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


var wordURLPrefix = 'http://api.wordnik.com:80/v4/word.json/';

var partOfSpeechURLPostfix = '/definitions?' + 
  'limit=4&' +
  'includeRelated=false&' + 
  'useCanonical=false&' + 
  'includeTags=false&' + 
  'api_key=' + apiKey;

var frequencyURLPostfix = '/frequency?' + 
  'useCanonical=false&' +
  'startYear=2003&' +
  'endYear=2012&' +
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

  function getPartsOfSpeech(word, done) {
    var url = wordURLPrefix + encodeURIComponent(word) + partOfSpeechURLPostfix;
    request(url, function parseReply(error, response, body) {
      if (error) {
        done(error);
      }
      else {
        // TODO: Validate JSON.
        var parsed = JSON.parse(body);
        var partOfSpeech = null;
        var partsFound = _.compact(_.pluck(parsed, 'partOfSpeech'));
        done(error, partsFound);
      }
    });
  }


  function getWordFrequency(word, done) {
    var url = wordURLPrefix + encodeURIComponent(word) + frequencyURLPostfix;
    request(url, function parseReply(error, response, body) {
      if (error) {
        console.log('getWordFrequency error!');
        done(error);
      }
      else {
        // TODO: Validate JSON.
        var parsed = JSON.parse(body);
        var totalCount = 9999999;
        if (typeof parsed.totalCount === 'number') {
          totalCount = parsed.totalCount;
        }
        else {
          console.log('Got word frequency body without totalCount in it for:',
            word);
        }
        done(error, totalCount);
      }
    });
  }  

  function runOperationOverWords(operation, words, done) {
    var q = queue();
    words.forEach(function addToQueue(word) {
      q.defer(operation, word);
    });
    q.awaitAll(done);    
  }

  function getPartsOfSpeechForMultipleWords(words, done) {
    runOperationOverWords(getPartsOfSpeech, words, done);
  }

  function getWordFrequencies(words, done) {
    runOperationOverWords(getWordFrequency, words, done);
  }

  return {
    getTopic: getTopic,
    getPartsOfSpeechForMultipleWords: getPartsOfSpeechForMultipleWords,
    getPartsOfSpeech: getPartsOfSpeech,
    getWordFrequency: getWordFrequency,
    getWordFrequencies: getWordFrequencies
  };
}

module.exports = createSource;
