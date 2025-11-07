# Task Manager API

[![CI](https://github.com/cyprus7/testTask/actions/workflows/ci.yaml/badge.svg)](https://github.com/cyprus7/testTask/actions/workflows/ci.yaml)
[![CD](https://github.com/cyprus7/testTask/actions/workflows/cd.yaml/badge.svg)](https://github.com/cyprus7/testTask/actions/workflows/cd.yaml)

A backend task manager built with **Bun.js** and **Elysia.js** following **Domain-Driven Design (DDD)** and **Clean Architecture** principles.
## ⚡ Fast Start

1. Copy the example env file:
```bash
cp apps/api/.env.local.example apps/api/.env.local
```

2. Start Docker Compose:
```bash
docker compose up
```

## 🏗️ Architecture

This project follows Clean Architecture with clear separation of concerns:

### Layers

1. **Domain Layer** (`apps/api/src/domain/`)
   - Contains business entities, value objects, and repository interfaces
   - Pure business logic with no external dependencies

2. **Application Layer** (`apps/api/src/application/`)
   - Use cases implementing business workflows
   - DTOs and validation schemas
   - Service interfaces

3. **Infrastructure Layer** (`apps/api/src/infrastructure/`)
   - Database implementations (DrizzleORM + PostgreSQL)
   - Cache implementation (Redis)
   - Queue implementation (Redis)

4. **Presentation Layer** (`apps/api/src/presentation/`)
   - HTTP controllers
   - Routes
   - Middleware (error handling, validation)

## 🚀 Features

- ✅ CRUD operations for tasks
- ✅ Async "due soon" notifications via Redis queue
- ✅ Redis caching for improved performance
- ✅ Input validation using Zod
- ✅ Centralized error handling
- ✅ SOLID principles
- ✅ PostgreSQL database with DrizzleORM
- ✅ Docker support for development

## 📋 Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) and Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd testTask
```

2. Install dependencies:
```bash
bun install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start Docker services (PostgreSQL + Redis):
```bash
bun run docker:up
```

5. Generate and push database schema:
```bash
bun run db:push
```

## 🏃 Running the Application

### Development Mode
```bash
bun run dev
```

### Production Mode
```bash
bun run start
```

The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Health Check
```http
GET /health
```

### Tasks

#### Get All Tasks
```http
GET /tasks?status=pending&priority=high
```

Query parameters:
- `status` (optional): Filter by status (pending, in_progress, completed, cancelled)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `dueDateFrom` (optional): Filter by due date from
- `dueDateTo` (optional): Filter by due date to

#### Get Task by ID
```http
GET /tasks/:id
```

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59Z"
}
```

#### Update Task
```http
PUT /tasks/:id
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "urgent"
}
```

#### Delete Task
```http
DELETE /tasks/:id
```

## 🔧 Database Management

> **Note:** Set the `DATABASE_URL` environment variable before running any Drizzle commands. Existing rows created before owner scoping will be backfilled with `owner_id = 0` during migration—adjust this value for your environment if needed.

### Generate migrations
```bash
bun run db:generate
```

### Apply migrations
```bash
bun run db:migrate
```

### Open Drizzle Studio (Database GUI)
```bash
bun run db:studio
```

## 📦 Docker Commands

### Start services
```bash
bun run docker:up
```

### Stop services
```bash
bun run docker:down
```

### View logs
```bash
docker-compose logs -f
```

## 🎯 Design Patterns & Principles

### SOLID Principles
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Interfaces can be swapped with implementations
- **Interface Segregation**: Specific interfaces for different use cases
- **Dependency Inversion**: Depend on abstractions, not concretions

### Clean Architecture
- **Independence**: Business logic independent of frameworks and databases
- **Testability**: Business rules can be tested without external dependencies
- **Framework Independence**: Not tied to Elysia.js or any specific framework
- **Database Independence**: Can switch from PostgreSQL to any other database

### DDD Concepts
- **Entities**: Task entity with unique identity
- **Value Objects**: TaskStatus, TaskPriority enums
- **Repositories**: Abstract data access
- **Use Cases**: Application-specific business rules

## ☸️ Kubernetes Deployment

### Helm chart

- Chart location: `deploy/helm/task-manager`
- Default host: `task20251104.test.chernov.us`
- Deploys the Bun/Elysia API, Service, optional Ingress, and optional HPA

#### Install / upgrade

```bash
helm upgrade --install task-manager ./deploy/helm/task-manager \
  --namespace task-manager \
  --create-namespace
```

#### Override configuration

- Copy `deploy/helm/task-manager/values.yaml` and adjust image, Redis/PostgreSQL endpoints, etc.
- Ensure the `DATABASE_URL` secret exists. Example:

  ```bash
  kubectl create secret generic task-manager-secrets \
    --namespace task-manager \
    --from-literal=DATABASE_URL="postgres://<db-user>:<db-password>@<db-host>:<db-port>/<db-name>" \
    --from-literal=REDIS_URL="redis://<redis-host>:6379/0"
  ```

- To use pre-defined production values (ingress host `task20251104.test.chernov.us`), provide:

  ```bash
  helm upgrade --install task-manager ./deploy/helm/task-manager \
    --namespace task-manager \
    --create-namespace \
    -f deploy/helm/task-manager/values-production.yaml
  ```

### Argo CD

- Application manifest: `deploy/argocd/application-task-manager.yaml`
- Update `spec.source.repoURL` to point to your Git repository before applying
- Apply to the Argo CD control plane:

  ```bash
  kubectl apply -f deploy/argocd/application-task-manager.yaml -n argocd
  ```

Argo CD will sync the Helm chart (using the production values file by default) and expose the API via the provided domain.

## 🔄 Async Notifications

The application includes an async notification system for tasks due soon:

- Every 5 minutes, the system checks for tasks due within 24 hours
- Tasks are enqueued to Redis queue for processing
- Queue workers process notifications asynchronously
- Notifications can be extended to send emails, SMS, push notifications, etc.

## 🧪 Testing

The application is designed for easy testing:

```bash
# Run tests (when implemented)
bun test
```

## 🤖 CI/CD

GitHub Actions workflow: `.github/workflows/ci-cd.yaml`

- Runs on pull requests and pushes to validate the Bun application with `bun test`
- Builds and publishes a Docker image to GitHub Container Registry when changes land on the `main` branch
- Uses `GITHUB_TOKEN` for registry authentication; configure repository secrets `REGISTRY_USER` and `REGISTRY_PASSWORD` if you prefer Docker Hub or another registry

To consume the published image in Kubernetes, override the Helm chart `image.repository` and `image.tag` values (for example using `--set image.repository=ghcr.io/<org>/task-manager,image.tag=<git-sha>`).

## 📁 Project Structure

```
testTask/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── domain/               # Business entities and rules
│   │   │   │   ├── entities/         # Domain entities
│   │   │   │   ├── repositories/     # Repository interfaces
│   │   │   │   └── value-objects/    # Value objects
│   │   │   ├── application/          # Application business rules
│   │   │   │   ├── dtos/             # Data Transfer Objects
│   │   │   │   ├── interfaces/       # Service interfaces
│   │   │   │   └── use-cases/        # Application use cases
│   │   │   ├── infrastructure/       # External implementations
│   │   │   │   ├── database/         # Database schema and connection
│   │   │   │   ├── cache/            # Redis cache implementation
│   │   │   │   ├── queue/            # Redis queue implementation
│   │   │   │   └── repositories/     # Repository implementations
│   │   │   ├── presentation/         # API layer
│   │   │   │   ├── controllers/      # HTTP controllers
│   │   │   │   ├── middleware/       # Middleware (error handling)
│   │   │   │   └── routes/           # Route definitions
│   │   │   ├── shared/               # Shared utilities
│   │   │   │   ├── config/           # Configuration
│   │   │   │   ├── errors/           # Custom error classes
│   │   │   │   └── container.ts      # Dependency injection
│   │   │   └── index.ts              # Application entry point
│   │   ├── drizzle/                  # Migrations for API (e.g. 0001_init_tasks.sql, meta/)
│   │   ├── Dockerfile                # Docker image for API
│   │   ├── package.json              # Dependencies and scripts (API)
│   │   └── tsconfig.json             # TypeScript configuration (API)
│   ├── tg-bot/
│   │   ├── Dockerfile                # Docker image for Telegram bot
│   │   ├── package.json              # Dependencies and scripts (tg-bot)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── bot.update.ts
│   │       └── observability/        # logging/otel/metrics
│   └── web/
│       ├── Dockerfile                # Docker image for web front-end
│       ├── package.json              # Dependencies and scripts (web)
│       └── src/
│           └── app/                  # Next.js / front-end sources
├── docker-compose.yml                # Docker services
├── drizzle.config.ts                 # Drizzle configuration
├── .env.example                      # Environment variables template
└── package.json                      # Root dependencies and scripts
```

## 🔐 Environment Variables

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/taskmanager
REDIS_URL=redis://localhost:6379/0
PORT=3000
NODE_ENV=development
TASK_NOTIFICATION_QUEUE=task-notifications
DUE_SOON_THRESHOLD_HOURS=24
```

## 📝 License

MIT