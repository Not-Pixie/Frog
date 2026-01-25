FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Build da aplicação
RUN npm run build

EXPOSE 5173

# Usa react-router serve para servir o build
CMD ["npx", "react-router-serve", "./build/server/index.js"]
