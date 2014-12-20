var createChroniclerServer = require('basicset-chronicler').createServer;

createChroniclerServer({
  dbLocation: 'tributes.db',
  port: 3030
});
