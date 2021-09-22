node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

VAULT_NAME=ft-next-lure-api
HEROKU_APP_STAGING=ft-next-lure-api-staging
HEROKU_APP_EU=ft-next-lure-api-eu
HEROKU_APP_US=ft-next-lure-api-us

coverage-report:
	export NODE_ENV=test; \
	export AWS_SIGNED_FETCH_DISABLE_DNS_RESOLUTION=true; \
	export FT_GRAPHITE_KEY=dummy-graphite-key; \
	istanbul cover node_modules/.bin/_mocha --report=$(if $(CIRCLECI),lcovonly,lcov) --exit 'test/**/*.spec.js'

unit-test:
	export NODE_ENV=test; \
	export AWS_SIGNED_FETCH_DISABLE_DNS_RESOLUTION=true; \
	export FT_GRAPHITE_KEY=dummy-graphite-key; \
	mocha --exit 'test/**/*.spec.js'

test:
	make verify

ifeq ($(CIRCLE_BRANCH_DISABLE_FOR_NOW),main)
	make coverage-report && cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
else
	make unit-test
endif

run:
	nht run --https --inspect
