#!/bin/bash

set -a
source .env
set +a

DOCKER_BUILD_CMD="docker build"

while IFS='=' read -r key value
do
    if [[ ! $key =~ ^# && -n $key ]]; then
        value=$(echo $value | sed -e 's/^"//' -e 's/"$//')
        DOCKER_BUILD_CMD+=" --build-arg $key=$value"
    fi
done < .env

DOCKER_BUILD_CMD+=" -t sicap-ai ."

echo "Executing: $DOCKER_BUILD_CMD"
eval $DOCKER_BUILD_CMD