test:
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/topicpool-tests.js
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/nounfinder-tests.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js

install-cron:
	echo "Note: You need to edit the paths in schedule.cron for this to work.\n"
	crontab schedule.cron
