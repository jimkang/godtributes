var logger = require('./logger');

module.exports = function handleTwitterError(error) {
  if (error) {
    logger.log('Response status', error.statusCode);
    logger.log('Data', error.data);
  }
};
