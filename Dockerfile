FROM node:20

WORKDIR /src/index

COPY package*.json ./

RUN npm install

COPY src/ .

EXPOSE 8080

CMD ["node", "index.js"]