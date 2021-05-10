const { expect } = require('chai');
const sinon = require('sinon');
const errorHandler = require('../../server/middleware/error-handler');

const FT_NO_CACHE = 'no cache';
const FT_HOUR_CACHE = 'hour cache';
const FT_SHORT_CACHE = 'short cache';

function createResponse () {
	return {
		headersSent: false,
		status: sinon.spy(),
		set: sinon.spy(),
		json: sinon.spy(),
		send: sinon.spy(),
		end: sinon.spy(),
		FT_NO_CACHE,
		FT_HOUR_CACHE,
		FT_SHORT_CACHE,
	};
}

describe('error-handler', () => {

	it('Not found error includes cache headers', () => {
		const error = new Error('Not Found');
		error.statusCode = 404;
		const request = {};
		const response = createResponse();
		const next = sinon.spy();
		errorHandler(error, request, response, next);
		expect(response.status.firstCall.args[0]).to.equal(404);
		expect(response.status.callCount).to.equal(1);
		expect(response.send.firstCall.args[0]).to.equal('Not Found');
		expect(response.set.calledWith('Cache-Control', FT_NO_CACHE)).to.be.true;
		expect(response.set.calledWith('Surrogate-Control', FT_SHORT_CACHE)).to.be.true;
	});

	it('should set status code to 500 when unknown error without statusCode', () => {
		const error = new Error();
		const request = {};
		const response = createResponse();
		const next = sinon.spy();
		errorHandler(error, request, response, next);
		expect(response.status.firstCall.args[0]).to.equal(500);
		expect(response.status.callCount).to.equal(1);
		expect(response.send.firstCall.args[0]).to.equal('Internal Server Error');
	});

	it('should set status code of the response base on the error statusCode', () => {
		const error = new Error();
		error.statusCode = 555;
		const request = {};
		const response = createResponse();
		const next = sinon.spy();
		errorHandler(error, request, response, next);
		expect(response.status.firstCall.args[0]).to.equal(555);
		expect(response.status.callCount).to.equal(1);
		expect(response.send.firstCall.args[0]).to.equal('Unknown error 555');
	});

	it('should call the next function with the error as an argument', () => {
		const error = new Error();
		const request = {};
		const response = createResponse();
		const next = sinon.spy();
		errorHandler(error, request, response, next);
		expect(next.calledOnceWith(error)).to.be.true;
	});

	it('should not set any headers if response.headersSent is true', () => {
		const error = new Error('Not Found');
		error.statusCode = 404;
		const request = {};
		const response = createResponse();
		response.headersSent = true;
		const next = sinon.spy();
		errorHandler(error, request, response, next);
		expect(response.status.notCalled).to.be.true;
		expect(response.set.notCalled).to.be.true;
		expect(next.calledOnceWith(error)).to.be.true;
	});

	it('should not set the status code if response.headersSent is true', () => {
		const error = new Error();
		const request = {};
		const response = createResponse();
		response.headersSent = true;
		const next = sinon.spy();
		errorHandler(error, request, response, next);
		expect(response.status.notCalled).to.be.true;
		expect(response.set.notCalled).to.be.true;
		expect(next.calledOnceWith(error)).to.be.true;
	});

});
