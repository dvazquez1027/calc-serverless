// Create clients and set shared const values outside of the handler

// Create a DocumentClient that represents the query to get an item
const AWS = require('aws-sdk');
const dynamodb = require('aws-sdk/clients/dynamodb');
const memcached = require('memcached-promise');
const _ = require('lodash');

const dynamodbEndpoint = process.env.DYNAMODB_ENDPOINT;
const docClient = new dynamodb.DocumentClient(!_.isEmpty(dynamodbEndpoint)
                                                ? {
                                                     endpoint: new AWS.Endpoint(dynamodbEndpoint)
                                                  }
                                                : null);

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

    let params = {
        TableName: tableName,
        Key: { id },
    };
    const { Item } = await docClient.get(params).promise();
    let response, responseStatusCode, responseBody;

    if (_.isEmpty(Item)) {
        responseStatusCode = 404;
        responseBody = 'Calculator with id=' + id + ' does not exist.';
    } else {
        if (httpMethod === 'GET') {
            responseStatusCode = 200;
            responseBody = JSON.stringify(Item);
        } else if (httpMethod === 'PUT') {
            let brain = await cacheClient.get(id);
            if (brain == null) {
                brain = {
                    result: Item.result,
                    stack: []
                };
            }
            let operations = JSON.parse(body);
            doCalculations(operations, brain);
            let item = {
                id: id,
                result: brain.result
            };
            let params = {
                TableName: tableName,
                Item: item
            }
            await docClient.put(params).promise();
            await cacheClient.set(item.id, brain);
            responseStatusCode = 200;
            responseBody = JSON.stringify(item);
        } else if (httpMethod === 'DELETE') {
            let params = {
                TableName: tableName,
                Key: { id },
            };
            await docClient.delete(params).promise();
            responseStatusCode = 200;
        }
    }

    response = {
        statusCode: responseStatusCode,
        body: responseBody
    };

    console.log(`response from: ${path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};

function doCalculations(operations, brain) {
    for (let operation in operations) {
        doCalculation(operations[operation], brain);
    }
}

function doCalculation(operation, brain) {
    let workingOp = { operator: operation.operator, operand: operation.operand };
    if (brain.stack.length >= 0) {
        brain.lastOperation = brain.stack[brain.stack.length-1];
        while (brain.stack.length > 0 &&
               precedenceOf(operation.operator) <= precedenceOf(brain.stack[brain.stack.length-1].operator)) {
            let op = brain.stack.pop();
            workingOp.operand = operate(op.operator, op.operand, workingOp.operand);
        }
    } else if (brain.lastOperation !== undefined && operation.operator == '=') {
        workingOp.operand = operate(lastOperation.operator, brain.result, lastOperation.operand);
    }

    if (operation.operator !== '=') {
        brain.stack.push(workingOp);
    }

    brain.result = workingOp.operand;
}

function precedenceOf(operator) {
    switch (operator) {
        case '-':
        case '+':
            return 1;

        case '/':
        case '*':
            return 2;

        case '=':
            return 0;

        default:
            return -1;
    }
}

function operate(operator, left, right) {
    let result;
    switch (operator) {
        case '+':
            result = left + right;
            break;

        case '-':
            result = left - right;
            break;

        case '*':
            result = left * right;
            break;

        case '/':
            result = left / right;
            break;

        default:
            result = left;
            break;
    }

    return result;
}
