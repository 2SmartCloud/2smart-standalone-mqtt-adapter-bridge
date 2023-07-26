FROM node:12.5-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache tzdata git

COPY package.json package.json
COPY app.js app.js
COPY lib/ lib/
COPY utils/ utils/

RUN npm i --production

CMD npm start
