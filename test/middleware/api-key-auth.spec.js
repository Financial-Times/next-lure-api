const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const loggerMock = {
	error: sinon.spy(),
	info: sinon.spy(),
	warn: sinon.spy()
};

const apiKeyAuth = proxyquire('../../server/middleware/api-key-auth', {
	'@financial-times/n-logger': {
		default: loggerMock
	}
});

process.env.LURE_API_READ_ONLY_KEYS = 'valid-api-key1,valid-api-key2';

function createResponse () {
	return {
		headersSent: false,
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

		expect(loggerMock.error).to.have.been.called;
		expect(next.calledOnce).to.be.true;
		expect(response.status).to.not.have.been.called;
	});

	it('should call next and fail if the api key is not valid', async () => {
		const request = {
			get: () => 'invalid-api-key'
		};

		const response = createResponse({ isStatusSpy: true });
		const next = sinon.spy();
		await apiKeyAuth(request, response, next);

		expect(loggerMock.error).to.have.been.called;
		expect(response.status.calledOnce).to.be.true;
		expect(response.status).to.have.been.calledWith(401);
	});
});
