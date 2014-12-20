var jsonfile = require('jsonfile');
var multilevel = require('multilevel');
var net = require('net');

var dbSingleton;

function createClientDb() {
	var manifest = jsonfile.readFileSync(__dirname + '/manifest.json');
	var db = multilevel.client(manifest);
	var connection = net.connect(3030);
	connection.pipe(db.createRpcStream()).pipe(connection);
	return db;
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
