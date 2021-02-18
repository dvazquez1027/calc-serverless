#! /bin/bash

# workaround so volume mounts work in git-bash. 
export MSYS_NO_PATHCONV=1

# alias AWS command to run using a container.
AWS="docker run --rm -it -v $(pwd)/.local-env/dynamodb/.aws:/root/.aws --network calc-serverless_calc-serverless amazon/aws-cli"

# The URL of the DynamoDB using hostname of the container on the internal network.
DYNAMO_DB_URL="http://dynamodb:8000"

# Start everything up
docker-compose up -d

# Initialize the database
if [ ! -e ".local-env/dynamodb/.initialized" ]; then
  $AWS dynamodb create-table \
      --table-name Calculators \
      --attribute-definitions AttributeName=id,AttributeType=S \
      --key-schema AttributeName=id,KeyType=HASH \
      --endpoint-url $DYNAMO_DB_URL \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
  touch .local-env/dynamodb/.initialized
fi
