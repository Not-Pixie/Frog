FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do projeto
COPY . .

EXPOSE 5173

# Modo dev com host para aceitar conexões externas
CMD ["npm", "run", "dev", "--", "--host"]
