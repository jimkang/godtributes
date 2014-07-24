var Bot = require('./node_modules/twit/examples/bot');
var config = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');
var figurepicker = require('./figurepicker');
var prepphrasepicker = require('./prepphrasepicker');
var logger = require('./logger');
var handleTwitterError = require('./handletwittererror');
var recordkeeper = require('./recordkeeper');

var wordnikSource = createWordnikSource();
var bot = new Bot(config.twitter);

var simulationMode = (process.argv[2] === '--simulate');

logger.log('Tribute maker is running.');

function postTribute() {
  wordnikSource.getTopic(function postOnTopic(error, topic) {
    if (error) {
      handleTwitterError(error);
    }
    else {
      var demandOpts = {
        topic: topic,
        prepositionalPhrase: prepphrasepicker.getPrepPhrase(),
        tributeFigure: figurepicker.getMainTributeFigure()
      };

      var tweetText = tributeDemander.makeDemandForTopic(demandOpts);

      if (simulationMode) {
        logger.log('Would have tweeted', tweetText);
      }
      else {
        bot.tweet(tweetText, function reportTweetResult(error, reply) {
          logger.log((new Date()).toString(), 'Tweet posted', reply.text);

        });
      }
      recordkeeper.recordThatTopicWasUsedInTribute(topic);
      
    }
  });  
}

postTribute();
