# Task Manager API - Example Requests

This file contains example API requests for manual testing.

## Health Check

```bash
curl http://localhost:3000/health
```

## Create Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "status": "pending",
    "priority": "high",
    "dueDate": "2025-12-31T23:59:59Z"
  }'
```

## Get All Tasks

```bash
curl http://localhost:3000/tasks
```

## Filter Tasks by Status

```bash
curl "http://localhost:3000/tasks?status=pending"
```

## Filter Tasks by Priority

```bash
curl "http://localhost:3000/tasks?priority=urgent"
```

## Get Task by ID

```bash
# Replace {id} with actual task ID
curl http://localhost:3000/tasks/{id}
```

## Update Task

```bash
# Replace {id} with actual task ID
curl -X PUT http://localhost:3000/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "priority": "urgent"
  }'
```

## Delete Task

```bash
# Replace {id} with actual task ID
curl -X DELETE http://localhost:3000/tasks/{id}
```

## Create Task Due Soon (for testing notifications)

```bash
# Create a task due in 12 hours
TOMORROW=$(date -u -d "+12 hours" +"%Y-%m-%dT%H:%M:%SZ")
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Urgent task\",
    \"description\": \"This will trigger a notification\",
    \"status\": \"pending\",
    \"priority\": \"urgent\",
    \"dueDate\": \"$TOMORROW\"
  }"
```

## Test Error Handling

### Invalid Task ID (404)
```bash
curl http://localhost:3000/tasks/00000000-0000-0000-0000-000000000000
```

### Validation Error (400)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "status": "invalid_status"
  }'
```
