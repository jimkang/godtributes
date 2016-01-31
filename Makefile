MOCHA = node_modules/mocha/bin/mocha
MOCHACMD = $(MOCHA) --ui tdd -R spec 
HOMEDIR = $(shell pwd)
PM2 = pm2
GITDIR = /var/repos/godtributes.git
USER = noderunner
LEVELCACHEDIR = '../level-cache-server'

test: test-exhort
	$(MOCHACMD) tests/tributedemander-tests.js
	$(MOCHACMD) tests/tweetanalyzer-tests.js

test-exhort:
	$(MOCHA) --R spec tests/exhort-tests.js -t 6000

test-exhort-integration: stop-chronicler start-chronicler start-level-cache
	node tests/integration/exhort-tweet-test.js

test-chronicler-stress: stop-chronicler start-chronicler start-level-cache
	node tests/integration/chronicler-stress-test.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js

start-chronicler:
	psy start -n godtributes-chronicler -- node start-chronicler.js

stop-chronicler:
	psy stop godtributes-chronicler || echo "Non-zero return code is OK."

start-exhortation-server:
	psy start -n exhortations -- node exhortationserver.js

restart-exhortation-server:
	psy restart exhortations

stop-exhortation-server:
	psy stop exhortations || echo "Non-zero return code is OK."

check-exhortation-server:
	psy log exhortations

npm-install:
	cd $(HOMEDIR)
	npm install
	npm prune

sync-worktree-to-git:
	git --work-tree=$(HOMEDIR) --git-dir=$(GITDIR) checkout -f

post-receive: sync-worktree-to-git \
	stop-exhortation-server stop-chronicler \
	npm-install \
	start-chronicler start-exhortation-server

# The idea is for the repo's post-receive hook to simply be:
# cd /var/www/godtributes && make post-receive

install-logrotate-conf:
	cp $(HOMEDIR)/admin/logrotate.conf_entry /etc/logrotate.d/godtributes

start-level-cache:
	$(PM2) start $(LEVELCACHEDIR)/start-cache-server.js --name level-cache || \
	echo "level-cache has already been started."

tribute:
	node maketribute.js

update-iscool:
	git pull origin master && \
		npm update --save iscool && \
		git commit -a -m"Updated iscool." && \
		make pushall

pushall:
	git push origin master && git push server master
