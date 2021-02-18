// Import dynamodb from aws-sdk
const dynamodb = require('aws-sdk/clients/dynamodb');
const memcached = require('memcached-promise');

// Import all functions from put-item.js
const lambda = require('../../../src/handlers/create-calculator.js');

// This includes all tests for putItemHandler
describe('Test createCalculatorHandler', () => {
    let putSpy;
    let setSpy;

    let db = {
    };

    let cache = {
    };

    // One-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
    beforeAll(() => {
        // Mock DynamoDB put method
        // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
        putSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put').mockImplementation((params) => {
            db[params.Item.id] = params.Item;
            return {
                promise: () => Promise.resolve('data')
            }
        });
        
        setSpy = jest.spyOn(memcached.prototype, 'set').mockImplementation((key, value) => {
            cache[key] = value;
            return Promise.resolve('data');
        });
    });

    // Clean up mocks
    afterAll(() => {
        putSpy.mockRestore();
        setSpy.mockRestore();
    });

    // This test invokes putItemHandler and compares the result
    it('should add id to the table', async () => {
        const event = {
            httpMethod: 'POST',
            body: '{"id":"id1","result":5}',
        };

        // Invoke putItemHandler()
        const result = await lambda.createCalculatorHandler(event);
        const expectedResult = {
            statusCode: 201,
            body: event.body,
        };

        // Compare the result with the expected result
        expect(result).toEqual(expectedResult);
        expect(setSpy).toBeCalledTimes(1);
        expect(cache['id1']).toEqual({result: 5, stack: []});
    });
});
