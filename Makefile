MOCHA = node_modules/mocha/bin/mocha
MOCHACMD = $(MOCHA) --ui tdd -R spec 
HOMEDIR = $(shell pwd)
GITDIR = /var/repos/godtributes.git
USER = noderunner

test: test-exhort test-analyze-tweet-images
	$(MOCHACMD) tests/tributedemander-tests.js

test-exhort:
	$(MOCHA) --R spec tests/exhort-tests.js -t 6000
	node tests/exhort-image-tests.js

test-exhort-integration:
	node tests/integration/exhort-tweet-test.js

test-chronicler-stress:
	node tests/integration/chronicler-stress-test.js

debug-test:
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/tributedemander-tests.js
	node_modules/mocha/bin/mocha debug --ui tdd -R spec tests/topicpool-tests.js

test-analyze-tweet-images:
	node tests/analyze-tweet-images-tests.js

start-exhortation-server:
	service godtributes start

stop-exhortation-server:
	service godtributes stop

npm-install:
	cd $(HOMEDIR)
	npm install
	npm prune

sync-worktree-to-git:
	git --work-tree=$(HOMEDIR) --git-dir=$(GITDIR) checkout -f

post-receive: sync-worktree-to-git \
	npm-install \
	chmod u+x exhortationserver.js
	service godtributes restart

# The idea is for the repo's post-receive hook to simply be:
# cd /var/www/godtributes && make post-receive

install-logrotate-conf:
	cp $(HOMEDIR)/admin/logrotate.conf_entry /etc/logrotate.d/godtributes

install-service:
	cp $(HOMEDIR)/godtributes.service /etc/systemd/system && \
	systemctl daemon-reload

tribute:
	node maketribute.js

update-iscool:
	git pull origin master && \
		npm update --save iscool && \
		git commit -a -m"Updated iscool." && \
		make pushall

pushall:
	git push origin master && git push server master
