FROM amazon/aws-sam-cli-build-image-nodejs12.x
WORKDIR /app
COPY ./package*.json ./
RUN npm set progress=false && npm ci
COPY ./ ./
RUN sam build
EXPOSE 3000
ENTRYPOINT ["sam", "local", "start-api", "--container-host", "host.docker.internal", "--container-host-interface", "0.0.0.0"]
