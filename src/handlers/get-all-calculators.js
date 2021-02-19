// Create clients and set shared const values outside of the handler

// Create a DocumentClient that represents the query to get all items
const AWS = require('aws-sdk');
const dynamodb = require('aws-sdk/clients/dynamodb');
const _ = require('lodash');

const dynamodbEndpoint = process.env.DYNAMODB_ENDPOINT;
const docClient = new dynamodb.DocumentClient(!_.isEmpty(dynamodbEndpoint)
                                                ? {
                                                     endpoint: new AWS.Endpoint(dynamodbEndpoint)
                                                  }
                                                : null);

// Get the DynamoDB table name from environment variables
const tableName = process.env.CALCULATORS_TABLE;

/**
 * A simple example includes a HTTP get method to get all items from a DynamoDB table.
 */
exports.getAllCalculatorsHandler = async (event) => {
    const { httpMethod, path } = event;
    if (httpMethod !== 'GET') {
        throw new Error(`getAllCalculators only accept GET method, you tried: ${httpMethod}`);
    }
    // All log statements are written to CloudWatch by default. For more information, see
    // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
    console.log('received:', JSON.stringify(event));

    // get all items from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
    // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
    const params = { TableName: tableName };
    const { Items } = await docClient.scan(params).promise();

    const response = {
        statusCode: 200,
        body: JSON.stringify(Items),
    };

    console.log(`response from: ${path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
