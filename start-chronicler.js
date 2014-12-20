var createChroniclerServer = require('chronicler/chronicler-server');

createChroniclerServer({
  dbLocation: 'tributes.db',
  port: 3030
});
