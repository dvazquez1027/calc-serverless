// Create clients and set shared const values outside of the handler

// Create a DocumentClient that represents the query to get an item
const dynamodb = require('aws-sdk/clients/dynamodb');
const memcached = required('memcached');

const docClient = new dynamodb.DocumentClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.CALCULATORS_TABLE;

const cacheHost = process.env.CALCULATORS_CACHE_HOST;
const cachePort = process.env.CALCULATORS_CACHE_PORT;
const cacheClient = new memcached(cacheHost + ':' + cachePort);

/**
 * A simple example includes a HTTP get method to get one item by id from a DynamoDB table.
 */
exports.getCalculatorByIdHandler = async (event) => {
    const { httpMethod, path, pathParameters, body } = event;
    if (!(httpMethod == 'GET' || httpMethod == 'PUT' || httpMethod == 'DELETE')) {
        throw new Error(`Method only access GET, PUT and DELETE. ${httpMethod} is not supported.`);
    }
    // All log statements are written to CloudWatch by default. For more information, see
    // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
    console.log('received:', JSON.stringify(event));

    // Get id from pathParameters from APIGateway because of `/{id}` at template.yml
    const { id } = pathParameters;

    // Get the item from the table
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
    const params = {
        TableName: tableName,
        Key: { id },
    };
    const { Item } = await docClient.get(params).promise();

    if (httpMethod == 'PUT') {
        ;// do the calculation and store the results.
    } else if (httpMethod == 'DELETE') {
        await docClient.delete(params).promise();
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(Item),
    };

    console.log(`response from: ${path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
