# Dockerfile para API Service
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

EXPOSE 3001

ENV PORT=3001
ENV API_VERSION=v1
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=catalogo_productos
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres

CMD ["node", "server.js"]

