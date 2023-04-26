const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const apiKeyAuth = require('../../server/middleware/api-key-auth');

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
		process.env.NODE_ENV = false;
		process.env.LURE_API_READ_ONLY_KEY = 'valid-api-key';
		const validApiKey = process.env.LURE_API_READ_ONLY_KEY;

		const request = {
			get: () => validApiKey
		};

		const response = createResponse();
		const next = sinon.spy();
		await apiKeyAuth(request, response, next);

		expect(next.calledOnce).to.be.true;
	});

	it('should call next and fail if the api key is not valid', async () => {
		process.env.NODE_ENV = false;
		process.env.LURE_API_READ_ONLY_KEY = 'valid-api-key';
		const invalidApiKey = 'invalid-api-key';

		const request = {
			get: () => invalidApiKey
		};

		const response = createResponse();
		const next = sinon.spy();
		await apiKeyAuth(request, response, next);

		expect(response.status.calledOnce).to.be.true;
	});

	it('should call next and move to the next middleware if NODE_ENV is equal to test', async () => {
		process.env.NODE_ENV = 'test';

		const request = {
			get: () => ''
		};

		const response = createResponse();
		const next = sinon.spy();
		await apiKeyAuth(request, response, next);

		expect(next.calledOnce).to.be.true;
	});

});
