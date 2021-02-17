// Import dynamodb from aws-sdk
const dynamodb = require('aws-sdk/clients/dynamodb');
const memcached = require('memcached-promise');

// Import all functions from put-item.js
const lambda = require('../../../src/handlers/create-calculator.js');

// This includes all tests for putItemHandler
describe('Test createCalculatorHandler', () => {
    let putSpy;
    let setSpy;

    // One-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
    beforeAll(() => {
        // Mock DynamoDB put method
        // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
        putSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put');
        setSpy = jest.spyOn(memcached.prototype, 'set');
    });

    // Clean up mocks
    afterAll(() => {
        putSpy.mockRestore();
        setSpy.mockRestore();
    });

    // This test invokes putItemHandler and compares the result
    it('should add id to the table', async () => {
        // Return the specified value whenever the spied put function is called
        putSpy.mockReturnValue({
            promise: () => Promise.resolve('data'),
        });

        setSpy.mockReturnValue(() => Promise.resolve('data'));

        const event = {
            httpMethod: 'POST',
            body: '{"id":"id1","name":"name1"}',
        };

        // Invoke putItemHandler()
        const result = await lambda.createCalculatorHandler(event);
        const expectedResult = {
            statusCode: 201,
            body: event.body,
        };

        // Compare the result with the expected result
        expect(result).toEqual(expectedResult);
    });
});
