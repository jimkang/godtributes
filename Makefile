test:
	mocha --ui tdd -R spec tests/tributedemander-tests.js
	mocha --ui tdd -R spec tests/topicpool-tests.js

debug-test:
	mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	mocha debug --ui tdd -R spec tests/topicpool-tests.js

