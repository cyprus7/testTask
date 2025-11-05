# Multi-stage build for Next.js
FROM node:18-alpine AS builder
WORKDIR /app
# Copy package files (works if package-lock.json is absent)
COPY package*.json ./
COPY . .
# Use npm ci when lockfile exists, otherwise fall back to npm install
RUN npm ci --silent || npm install --silent
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["npm", "run", "start"]
