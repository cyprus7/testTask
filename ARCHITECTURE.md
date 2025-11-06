# Architecture Documentation

## Overview

This Task Manager API is built following **Clean Architecture** and **Domain-Driven Design (DDD)** principles, ensuring a highly maintainable, testable, and scalable codebase.

## Architecture Layers

### 1. Domain Layer (`apps/api/src/domain/`)

The innermost layer containing the core business logic and rules.

**Components:**
- **Entities** (`entities/`): Core business objects (Task)
- **Value Objects** (`value-objects/`): Immutable objects representing domain concepts (TaskStatus, TaskPriority)
- **Repository Interfaces** (`repositories/`): Contracts for data access without implementation details

**Key Principles:**
- No dependencies on outer layers
- Pure business logic
- Framework-agnostic
- Database-agnostic

**Files:**
- `entities/Task.ts`: Task entity definition with enums for status and priority
- `repositories/ITaskRepository.ts`: Repository interface contract

### 2. Application Layer (`src/application/`)

Contains application-specific business rules and orchestrates the flow of data.

**Components:**
- **Use Cases** (`use-cases/`): Application-specific business operations
- **DTOs** (`dtos/`): Data Transfer Objects with validation schemas
- **Interfaces** (`interfaces/`): Service contracts (cache, queue)

**Key Principles:**
- Orchestrates domain objects
- Implements business workflows
- Independent of UI and database
- Contains validation logic

**Files:**
- `use-cases/CreateTaskUseCase.ts`: Create new task
- `use-cases/GetTasksUseCase.ts`: Retrieve tasks with caching
- `use-cases/GetTaskByIdUseCase.ts`: Retrieve single task
- `use-cases/UpdateTaskUseCase.ts`: Update existing task
- `use-cases/DeleteTaskUseCase.ts`: Delete task
- `use-cases/CheckDueSoonTasksUseCase.ts`: Find and enqueue tasks due soon
- `dtos/TaskDTO.ts`: Zod schemas for request validation
- `interfaces/ICacheService.ts`: Cache service contract
- `interfaces/IQueueService.ts`: Queue service contract

### 3. Infrastructure Layer (`src/infrastructure/`)

Contains implementations of interfaces defined in inner layers.

**Components:**
- **Database** (`database/`): Database schema and connection (DrizzleORM + PostgreSQL)
- **Repositories** (`repositories/`): Concrete repository implementations
- **Cache** (`cache/`): Redis cache implementation
- **Queue** (`queue/`): Redis queue implementation

**Key Principles:**
- Implements interfaces from inner layers
- Contains framework-specific code
- Handles external dependencies
- Swappable implementations

**Files:**
- `database/schema.ts`: Drizzle schema definition
- `database/connection.ts`: Database connection setup
- `repositories/TaskRepository.ts`: Task repository implementation
- `cache/RedisCacheService.ts`: Redis cache service
- `queue/RedisQueueService.ts`: Redis queue service

### 4. Presentation Layer (`src/presentation/`)

Handles HTTP requests and responses.

**Components:**
- **Controllers** (`controllers/`): Handle HTTP requests and delegate to use cases
- **Routes** (`routes/`): Define API endpoints
- **Middleware** (`middleware/`): Error handling, validation, etc.

**Key Principles:**
- Thin layer, minimal logic
- Delegates to use cases
- Handles HTTP concerns only
- Framework-specific (Elysia.js)

**Files:**
- `controllers/TaskController.ts`: Task HTTP controller
- `routes/taskRoutes.ts`: Task route definitions
- `middleware/errorHandler.ts`: Centralized error handling

### 5. Shared Layer (`src/shared/`)

Contains cross-cutting concerns used across all layers.

**Components:**
- **Config** (`config/`): Application configuration
- **Errors** (`errors/`): Custom error classes
- **Container** (`container.ts`): Dependency injection container

**Files:**
- `config/index.ts`: Environment configuration with Zod validation
- `errors/index.ts`: Custom error classes (AppError, NotFoundError, ValidationError, etc.)
- `container.ts`: Manual dependency injection setup

## Data Flow

```
HTTP Request
    ↓
Routes (Presentation)
    ↓
Controller (Presentation)
    ↓
Use Case (Application)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Infrastructure)
    ↓
Database (Infrastructure)
```

## Dependency Rule

**Dependencies point inward:**
- Presentation → Application → Domain
- Infrastructure → Application, Domain
- Domain has no dependencies on outer layers

This ensures the business logic is protected from external changes.

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each class has one reason to change
- Use cases handle one specific operation
- Controllers handle one route group
- Repositories handle one entity's data access

### Open/Closed Principle (OCP)
- Repository interfaces allow new implementations without changing use cases
- Service interfaces allow swapping cache/queue providers
- Error handling is extensible with new error types

### Liskov Substitution Principle (LSP)
- Any implementation of ITaskRepository can replace another
- ICacheService implementations are interchangeable
- IQueueService implementations are interchangeable

### Interface Segregation Principle (ISP)
- Small, focused interfaces (ICacheService, IQueueService)
- Use cases depend only on methods they use
- No fat interfaces forcing unnecessary dependencies

### Dependency Inversion Principle (DIP)
- High-level modules (use cases) depend on abstractions (interfaces)
- Low-level modules (repositories) implement abstractions
- No direct dependencies on concrete implementations

## Design Patterns

### Repository Pattern
- Abstracts data access logic
- Domain layer defines interface
- Infrastructure layer implements it
- Enables testing without database

### Dependency Injection
- Manual DI container in `container.ts`
- All dependencies injected through constructors
- Enables easy testing and swapping implementations

### Strategy Pattern
- Different cache strategies possible (Redis, in-memory, etc.)
- Different queue strategies possible (Redis, RabbitMQ, etc.)
- Configured through interface implementations

### Use Case Pattern
- Encapsulates business operations
- Single entry point for each action
- Easy to test and maintain

## Technology Stack

### Runtime & Framework
- **Bun.js**: Fast JavaScript runtime
- **Elysia.js**: Fast web framework for Bun

### Database & ORM
- **PostgreSQL**: Relational database
- **DrizzleORM**: Type-safe ORM
- **Drizzle Kit**: Schema management

### Cache & Queue
- **Redis**: In-memory data store for both caching and queuing

### Validation
- **Zod**: TypeScript-first schema validation

### Development
- **Docker**: Containerization for PostgreSQL and Redis
- **TypeScript**: Type safety

## Async Notifications System

The application implements an async notification system using Redis queue:

1. **Periodic Check**: Every 5 minutes, `CheckDueSoonTasksUseCase` runs
2. **Task Discovery**: Finds tasks due within 24 hours (configurable)
3. **Queue Enqueue**: Adds task notifications to Redis queue
4. **Queue Processing**: Background worker processes notifications
5. **Notification Delivery**: Logs notification (can be extended to email/SMS/push)

**Benefits:**
- Decoupled from main request flow
- Scalable (can add multiple workers)
- Resilient (Redis persistence)
- Non-blocking

## Caching Strategy

### Cache Invalidation
- **Write-through**: Delete cache on updates
- **Read-through**: Check cache before database
- **TTL**: 5 minutes for task lists and individual tasks

### Cache Keys
- `task:{id}`: Individual task
- `tasks:all:{filters}`: Task lists with filters

### Benefits
- Reduced database load
- Faster response times
- Scalable read operations

## Error Handling

### Centralized Error Handler
All errors are caught and handled in `errorHandler.ts`:

1. **AppError**: Custom application errors with status codes
2. **ZodError**: Validation errors from Zod schemas
3. **Generic Errors**: Caught and returned as 500 Internal Server Error

### Custom Error Types
- `NotFoundError` (404)
- `ValidationError` (400)
- `ConflictError` (409)
- `InternalServerError` (500)

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 404
  }
}
```

## Testing Strategy

### Unit Tests
- Test use cases in isolation
- Mock repositories and services
- Test domain logic

### Integration Tests
- Test API endpoints
- Test database operations
- Test queue processing

### Test Isolation
- Clean Architecture enables easy mocking
- Interfaces allow test doubles
- No framework dependencies in business logic

## Scalability Considerations

### Horizontal Scaling
- Stateless API (can run multiple instances)
- Shared Redis for cache consistency
- Shared PostgreSQL database

### Performance
- Redis caching reduces database load
- Connection pooling for database
- Async queue processing for notifications

### Monitoring
- Health check endpoint
- Structured logging
- Error tracking

## Future Enhancements

1. **Authentication & Authorization**: JWT, OAuth, RBAC
2. **Pagination**: Cursor-based or offset pagination
3. **Search**: Full-text search with ElasticSearch
4. **File Attachments**: S3 integration for task attachments
5. **Real-time Updates**: WebSocket support
6. **Audit Logging**: Track all changes
7. **Rate Limiting**: Prevent abuse
8. **API Versioning**: v1, v2 endpoints
9. **Swagger Documentation**: OpenAPI spec
10. **Metrics**: Prometheus, Grafana
