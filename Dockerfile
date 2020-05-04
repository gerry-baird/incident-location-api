FROM node:12.16.3-alpine3.9
USER node

RUN mkdir /home/node/location-api

WORKDIR /home/node/location-api

COPY package.json /home/node/location-api
COPY app.js /home/node/location-api
RUN npm install
CMD ["npm", "start"]