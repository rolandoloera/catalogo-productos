# Dockerfile para Frontend Service
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

ENV PORT=3000
ENV API_URL=http://localhost:3001

CMD ["node", "server.js"]

