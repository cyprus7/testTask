FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY . .
RUN npm ci --silent
EXPOSE 3002
CMD ["node", "./src/index.js"]
