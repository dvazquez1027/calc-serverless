// Import dynamodb from aws-sdk
const dynamodb = require('aws-sdk/clients/dynamodb');
const memcached = require('memcached-promise');

// Import all functions from get-by-id.js
const lambda = require('../../../src/handlers/get-calculator-by-id.js');

// This includes all tests for getByIdHandler
describe('Test getCalculatorByIdHandler', () => {
    let dbGetSpy;
    let dbPutSpy;
    let dbDeleteSpy;
    let cacheGetSpy;
    let cacheSetSpy;

    let db = {
        '1': { id: '1', result: 0.0},
        '2': { id: '2', result: 0.0}
    };

    let cache = {
        '1': { result: 0.0, stack: [] }
    };

    // One-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
    beforeAll(() => {
        // Mock DynamoDB get method
        // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
        dbGetSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'get').mockImplementation((params) => {
            return {
                promise: () => Promise.resolve({Item: db[params.Key.id]})
            };
        });

        dbPutSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put').mockImplementation((params) => {
            db[params.Item.id] = params.Item;
            return {
                promise: () => Promise.resolve('data')
            }
        });

        dbDeleteSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'delete').mockImplementation((params) => {
            delete db[params.Key.id];
            return {
                promise: () => Promise.resolve('data')
            };
        });

        cacheGetSpy = jest.spyOn(memcached.prototype, 'get').mockImplementation((key) => {
            return Promise.resolve(cache[key]);
        });

        cacheSetSpy = jest.spyOn(memcached.prototype, 'set').mockImplementation((key, value) => {
            cache[key] = value;
            return Promise.resolve('data');
        });
    });

    // Clean up mocks
    afterAll(() => {
        dbGetSpy.mockRestore();
        dbPutSpy.mockRestore();
        dbDeleteSpy.mockRestore();
        cacheGetSpy.mockRestore();
        cacheSetSpy.mockRestore();
    });

    // This test invokes getByIdHandler and compares the result
    it('should get item by id', async () => {
        // when 
        const event = {
            httpMethod: 'GET',
            pathParameters: {
                id: '1',
            },
        };
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '1', result: 0.0 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should add', async () => {
        // when
        const event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: '1'
            },
            body: '[{ "operator": "+", "operand": 5}, { "operator": "=", "operand": 5 }]'
        }
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '1', result: 10 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should add cache miss', async () => {
        // when
        const event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: '2'
            },
            body: '[{ "operator": "+", "operand": 5}, { "operator": "=", "operand": 5 }]'
        }
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '2', result: 10 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should subtract', async () => {
        // when
        const event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: '1'
            },
            body: '[{ "operator": "-", "operand": 15}, { "operator": "=", "operand": 5 }]'
        }
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '1', result: 10 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should multiply', async () => {
        // when
        const event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: '1'
            },
            body: '[{ "operator": "*", "operand": 5}, { "operator": "=", "operand": 5 }]'
        }
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '1', result: 25 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should divide', async () => {
        // when
        const event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: '1'
            },
            body: '[{ "operator": "/", "operand": 5}, { "operator": "=", "operand": 5 }]'
        }
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '1', result: 1 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should obey order of operations', async () => {
        // when
        const event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: '1'
            },
            body: '[{ "operator": "+", "operand": 5}, { "operator": "*", "operand": 5 }, {"operator": "=", "operand": 2}]'
        }
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '1', result: 15 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should obey order of operations 2', async () => {
        // when
        const event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: '1'
            },
            body: '[{ "operator": "*", "operand": 5}, { "operator": "+", "operand": 5 }, {"operator": "=", "operand": 2}]'
        }
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedItem = { id: '1', result: 27 };
        const expectedResult = {
            statusCode: 200,
            body: JSON.stringify(expectedItem),
        };
        expect(result).toEqual(expectedResult);
    });

    it('should delete calculator', async () => {
        // when
        const event = {
            httpMethod: 'DELETE',
            pathParameters: {
                id: '1'
            }
        };
        const result = await lambda.getCalculatorByIdHandler(event);

        // then
        const expectedResult = {
            statusCode: 200
        };
        expect(result).toEqual(expectedResult);
    });
});
