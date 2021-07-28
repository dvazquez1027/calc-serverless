FROM amazon/aws-sam-cli-build-image-nodejs12.x

WORKDIR /app

COPY ./ ./

RUN sam build

EXPOSE 3000

CMD ["sam", "local", "start-api"]
