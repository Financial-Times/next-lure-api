process.env.NODE_ENV = 'test';
process.env.AWS_SIGNED_FETCH_DISABLE_DNS_RESOLUTION = 'true';
process.env.FT_GRAPHITE_KEY = 'dummy-graphite-key';
process.env.INTERNAL_SMOKE_TEST_KEY = 'dummy-smoke-test-key';

module.exports = {
	exit: true
};
