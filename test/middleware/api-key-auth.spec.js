const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const apiKeyAuth = require('../../server/middleware/api-key-auth');
process.env.LURE_API_READ_ONLY_KEYS = 'valid-api-key1,valid-api-key2';

function createResponse () {
	return {
		headersSent: false,
		status: sinon.spy(),
		status: sinon.stub().returns({
			json: () => {}
		}),
		json: sinon.spy(),
		send: sinon.spy(),
		end: sinon.spy(),
	};
}

describe('verifies API Key', () => {
	it('should call next and move to the next middleware if the provided api key is valid', async () => {
		const request = {
			get: () => process.env.INTERNAL_SMOKE_TEST_KEY
		};

		const response = createResponse();
		const next = sinon.spy();
		await apiKeyAuth(request, response, next);

		expect(next.calledOnce).to.be.true;
	});

	it('should call next and fail if the api key is not valid', async () => {
		const request = {
			get: () => 'invalid-api-key'
		};

		const response = createResponse();
		const next = sinon.spy();
		await apiKeyAuth(request, response, next);

		expect(response.status.calledOnce).to.be.true;
	});
});
