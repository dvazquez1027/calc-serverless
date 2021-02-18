#!/bin/sh

sam local start-api --docker-network calc-serverless_calc-serverless --profile local --region us-east-1 --env-vars env.json --warm-containers=EAGER