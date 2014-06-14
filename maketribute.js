var Bot = require('./node_modules/twit/examples/bot');
var config1 = require('./config');
var createWordnikSource = require('./wordniksource');
var tributeDemander = require('./tributedemander');

var wordnikSource = createWordnikSource();
var bot = new Bot(config1);

console.log('Tribute maker is running.');

function postTribute() {
  wordnikSource.getTopic(function postOnTopic(error, topic) {
    if (error) {
      handleError(error);
    }
    else {
      bot.tweet(tributeDemander.makeDemandForTopic(topic), 
        function reportTweetResult(error, reply) {
          console.log('Tweet posted:', reply.text);
        }
      );
    }
  });  
}

postTribute();

setInterval(postTribute, 3 * 60 * 60 * 1000);

function handleError(error) {
  console.error('response status:', error.statusCode);
  console.error('data:', error.data);
}
