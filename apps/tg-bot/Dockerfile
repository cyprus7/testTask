FROM node:20-alpine
WORKDIR /app

# Copy root manifests and app package so workspaces can be resolved when context is repo root
COPY package.json package-lock.json ./
COPY apps/tg-bot/package.json ./apps/tg-bot/package.json

# Copy workspace packages and app sources
COPY packages ./packages
COPY apps/tg-bot ./apps/tg-bot

# Install dependencies at repo root (resolves workspaces)
RUN npm install --silent

WORKDIR /app/apps/tg-bot

# Build the NestJS app
RUN npm run build

EXPOSE 8080
CMD ["npm", "run", "start:prod"]
