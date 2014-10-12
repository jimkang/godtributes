test:
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/topicpool-tests.js -t 3000
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/nounfinder-tests.js
	node_modules/mocha/bin/mocha --ui tdd -R spec tests/recordkeeper-tests.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js

install-cron:
	echo "Note: You need to edit the paths in schedule.cron for this to work.\n"
	crontab -l > tmp.cron && cat tmp.cron schedule.cron > tmp.cron && crontab tmp.cron
