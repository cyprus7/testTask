# CI/CD Pipeline Split and Bun Setup Fix

## Changes Made

### 1. Split CI/CD into Separate Workflows

**Before:** Single `ci-cd.yaml` file
**After:** Separate `ci.yaml` and `cd.yaml` files

#### CI Pipeline (`ci.yaml`)
- Runs on push and pull requests
- Uses Bun v2 setup action with specific version (1.1.34)
- Added dependency caching for better performance
- Includes linting, testing, and build checks
- Only requires read permissions

#### CD Pipeline (`cd.yaml`)
- Runs on pushes to main/master or after successful CI
- Builds and pushes Docker images to GitHub Container Registry
- Uses multi-platform builds (amd64, arm64)
- Includes proper image metadata and tagging
- Includes ArgoCD notification placeholder

### 2. Fixed Bun Setup Issues

**Problems Fixed:**
- Updated from `oven-sh/setup-bun@v1` to `@v2`
- Specified exact Bun version (1.1.34) instead of "1.x" or "latest"
- Added registry URL configuration
- Added dependency caching to avoid cache service errors

**Root Cause of Original Error:**
The HTTP 400 error was caused by:
1. Using outdated setup-bun action (v1)
2. Vague version specification ("1.x")
3. Missing cache configuration

### 3. Improved Docker Configuration

**Dockerfile Improvements:**
- Updated to Bun 1.1-alpine (more stable)
- Fixed lockfile name (`bun.lockb` instead of `bun.lock`)
- Added security: non-root user
- Added health check
- Optimized build process

**Added `.dockerignore`:**
- Excludes unnecessary files from Docker context
- Reduces image size and build time

### 4. Added Monitoring

- Added CI/CD status badges to README
- Improved workflow triggers and dependencies
- Added proper error handling and notifications

## Usage

### Running CI
CI runs automatically on:
- Push to main/master branches
- Pull requests to main/master branches

### Running CD
CD runs automatically on:
- Push to main/master branches (after CI passes)
- Manual workflow dispatch (if configured)

### Local Development
```bash
# Install dependencies
bun install

# Run tests
bun test

# Run development server
bun run dev

# Build Docker image
docker build -t task-manager .

# Run with Docker Compose
docker-compose up -d
```

## Benefits

1. **Faster Feedback:** CI runs independently and faster
2. **Better Security:** Separate permissions for CI and CD
3. **Improved Reliability:** Fixed Bun setup issues
4. **Better Monitoring:** Status badges and proper notifications
5. **Optimized Builds:** Better caching and multi-platform support