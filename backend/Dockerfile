FROM node:24.6.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5678

CMD ["npm", "run", "start"]
