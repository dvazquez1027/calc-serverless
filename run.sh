#!/bin/sh

cd "$( dirname ${BASH_SOURCE[0]})"

#sam build

if [ $# -lt 1 ]; then
    echo "Running sam local start-api with default parameters."
    sam local start-api --docker-network calc-serverless_calc-serverless --profile local --region us-east-1 --env-vars env.json --warm-containers=EAGER
else
    echo "Running sam local start-api with provided parameters."
    sam local start-api "$@"
fi
