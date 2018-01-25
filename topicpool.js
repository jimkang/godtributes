var logger = require('./logger').logger;

// opts:
//  sources: The sources for the topics in fallback order.

function createTopicPool(opts) {
  function getTopic(done) {
    var sourceIndex = 0;

    function checkTopic(error, topic) {
      if (error) {
        logger.error(error);
        sourceIndex += 1;
        if (sourceIndex < opts.sources.length) {
          getTopicFromSource(opts.sources[sourceIndex], done);
        } else {
          done(error);
        }
      } else {
        done(error, topic);
      }
    }

    getTopicFromSource(opts.sources[sourceIndex], checkTopic);
  }

  function getTopicFromSource(source, done) {
    source.getTopic(done);
  }

  return {
    getTopic: getTopic
  };
}

module.exports = createTopicPool;
