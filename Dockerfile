# Usar la imagen oficial de Node.js
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto (Cloud Run usa la variable PORT)
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "server.js"]

