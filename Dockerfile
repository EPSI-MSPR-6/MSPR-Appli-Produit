FROM node:20

WORKDIR /src/index

COPY package*.json ./

RUN npm install

COPY src/ .
COPY config/ .

EXPOSE 8081

CMD ["node", "index.js"]