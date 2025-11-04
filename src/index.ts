import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from './shared/config';
import { container } from './shared/container';
import { createTaskRoutes } from './presentation/routes/taskRoutes';
import { errorHandler } from './presentation/middleware/errorHandler';

// Initialize services
const cacheService = container.getCacheService();
const queueService = container.getQueueService();
const checkDueSoonTasksUseCase = container.getCheckDueSoonTasksUseCase();

// Connect to Redis services
await cacheService.connect();
await queueService.connect();

// Setup notification queue processor
queueService.process(config.TASK_NOTIFICATION_QUEUE, async (data) => {
  console.log('📧 Processing notification for task:', data);
  // Here you would send actual notifications (email, SMS, push, etc.)
  // For now, we just log it
  console.log(`Notification: Task "${data.title}" is due soon!`);
  console.log(`Due Date: ${data.dueDate}`);
  console.log(`Priority: ${data.priority}`);
});

// Schedule periodic check for due soon tasks (every 5 minutes)
setInterval(async () => {
  try {
    await checkDueSoonTasksUseCase.execute();
  } catch (error) {
    console.error('Error checking due soon tasks:', error);
  }
}, 5 * 60 * 1000);

// Create the Elysia app
const app = new Elysia()
  .use(cors())
  .use(errorHandler)
  .get('/health', () => ({
    success: true,
    message: 'Task Manager API is running',
    timestamp: new Date().toISOString(),
  }))
  .use(createTaskRoutes(container.taskController))
  .listen(config.PORT);

console.log(`🚀 Task Manager API is running at http://localhost:${app.server?.port}`);
console.log(`📊 Environment: ${config.NODE_ENV}`);
console.log(`🔍 Health check: http://localhost:${app.server?.port}/health`);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await cacheService.disconnect();
  await queueService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await cacheService.disconnect();
  await queueService.disconnect();
  process.exit(0);
});
