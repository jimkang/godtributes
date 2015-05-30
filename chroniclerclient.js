var jsonfile = require('jsonfile');
var multilevel = require('multilevel');
var net = require('net');

var dbSingleton;

function createClientDb() {
	var manifest = jsonfile.readFileSync(__dirname + '/manifest.json');
	var db = multilevel.client(manifest);
	var connection = net.connect(3030);
	connection.on('end', handleConnectionEnd);
	var rpcStream = db.createRpcStream();
	connection.pipe(rpcStream).pipe(connection);

	rpcStream.on('error', handleRPCStreamError);
	return db;
}

function handleRPCStreamError(error) {
	console.log('Chronicler RPC stream error!', error.stack || error);
}

function handleConnectionEnd() {
  console.log('Disconnected from chronicler server!');
}

function getDb() {
	if (!dbSingleton) {
		dbSingleton = createClientDb();
	}
	return dbSingleton;
}

module.exports = {
	getDb: getDb
};
