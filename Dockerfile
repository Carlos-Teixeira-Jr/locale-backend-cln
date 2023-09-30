FROM node:16.14.0-alpine

WORKDIR /usr/src/app
RUN apk update
RUN apk add --no-cache curl
COPY package.json ./

RUN yarn

COPY . .

ENV APP_ENV=development
ENV PORT=4046

RUN yarn tsc -b
RUN cp -r contract dist

EXPOSE 4046

CMD ["node", "dist/server.js"]