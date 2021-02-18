#! /bin/sh

docker-compose down

# docker images | awk '{ print $1 }' | grep wcst | xargs docker image rm

rm .local-env/dynamodb/.initialized