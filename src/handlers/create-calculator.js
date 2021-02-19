// Create clients and set shared const values outside of the handler

// Create a DocumentClient that represents the query to add an item
const AWS = require('aws-sdk');
const dynamodb = require('aws-sdk/clients/dynamodb');
const memcached = require('memcached-promise');
const _ = require('lodash');

const dynamodbEndpoint = process.env.DYNAMODB_ENDPOINT;
var docClient;
if (!_.isEmpty(dynamodbEndpoint)) {
    docClient = new dynamodb.DocumentClient({ endpoint: new AWS.Endpoint(dynamodbEndpoint)});
} else {
    docClient = new dynamodb.DocumentClient();
}

// Get the DynamoDB table name from environment variables
const tableName = process.env.CALCULATORS_TABLE;

const cacheHost = process.env.CALCULATORS_CACHE_HOST;
const cachePort = process.env.CALCULATORS_CACHE_PORT;
const cacheClient = new memcached(cacheHost + ':' + cachePort);

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
exports.createCalculatorHandler = async (event) => {
    const { body, httpMethod, path } = event;
    if (httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${httpMethod} method.`);
    }
    // All log statements are written to CloudWatch by default. For more information, see
    // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
    console.log('received:', JSON.stringify(event));

    // Get id and name from the body of the request
    const { id, result } = JSON.parse(body);

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    const params = {
        TableName: tableName,
        Item: { id, result },
    };
    console.log('Writing to DynamoDB:', JSON.stringify(params));
    await docClient.put(params).promise();

    const cacheItem = {
        result: result,
        stack: []
    };
    console.log('Writing to Cache:', JSON.stringify(cacheItem));
    await cacheClient.set(id, cacheItem, 3600);

    const response = {
        statusCode: 201,
        body,
    };

    console.log(`response from: ${path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
