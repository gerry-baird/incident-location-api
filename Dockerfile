FROM registry.access.redhat.com/ubi8/nodejs-12 as base

WORKDIR /opt/app-root

COPY package*.json ./

COPY app.js ./

RUN npm ci

ENV PORT=8080

CMD ["npm", "start"]