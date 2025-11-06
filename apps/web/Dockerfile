# Multi-stage build for Next.js in a monorepo
FROM node:20-alpine AS builder
WORKDIR /app

# Accept NEXT_PUBLIC_API_URL as a build-arg and expose it as env for the build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy root package manifests (if present) and the app package separately.
# When build context is the repo root, this ensures we install workspace deps.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# Copy workspace packages and app sources (only what's needed)
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies at the repo root so workspaces are resolved.
# Use npm install to ensure we can update lockfile inside the build context
# (ci would fail if the checked-in lockfile is stale).
RUN npm install --silent

# Build the web workspace
RUN npm --workspace=apps/web run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# expose NEXT_PUBLIC_API_URL at runtime too (will be populated from build-arg if provided)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy only the built output and the app package.json/node_modules required to run
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["npm", "run", "start"]
