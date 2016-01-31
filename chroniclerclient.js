var jsonfile = require('jsonfile');
var multilevel = require('multilevel');
var net = require('net');
var callNextTick = require('call-next-tick');
var _ = require('lodash');
var logger = require('./logger');

var dbSingleton;

function createClientDb() {
	var manifest = jsonfile.readFileSync(__dirname + '/manifest.json');
	var db = multilevel.client(manifest);
	createRPCConnections(db);

	return db;
}

function createRPCConnections(db) {
	var client = connectToPort(3030);
	connectClientToDb(client, db);

	function connectToPort(port) {
		var client = net.connect(port);
		client.on('end', handleConnectionEnd);
		return client;
	}

	function connectClientToDb(client, db) {
		var rpcStream = db.createRpcStream();
		client.pipe(rpcStream).pipe(client);

		rpcStream.on('error', handleRPCStreamError);
		return rpcStream;
	}

	function handleConnectionEnd() {
	  logger.warn('Disconnected from chronicler server! Reconnecting.');
	  client.unpipe();
	  rpcStream.unpipe();
	  callNextTick(createRPCConnections, db);
	}
}

function handleRPCStreamError(error) {
	logger.error('Chronicler RPC stream error!', error.stack || error);
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
