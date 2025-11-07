import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from './shared/config';
import { container } from './shared/container';
import { createTaskRoutes } from './presentation/routes/taskRoutes';
import { errorHandler } from './presentation/middleware/errorHandler';
import { authMiddlewareForTasks } from './presentation/middleware/telegramAuthMiddleware';

// Initialize services
const cacheService = container.getCacheService();
const queueService = container.getQueueService();
const checkDueSoonTasksUseCase = container.getCheckDueSoonTasksUseCase();
const taskRepository = container.getTaskRepository();

// Connect to Redis services
await cacheService.connect();
await queueService.connect();

// Setup notification queue processor
queueService.process<{ ownerId: number; taskId: string; title: string; dueDate?: string | Date; priority?: string }>(
  config.TASK_NOTIFICATION_QUEUE,
  (data) => {
    console.log('📧 Processing notification for task:', data);
    // Here you would send actual notifications (email, SMS, push, etc.)
    // For now, we just log it
    console.log(`Notification: Task "${data.title}" is due soon for owner ${data.ownerId}!`);
    console.log(`Due Date: ${String(data.dueDate)}`);
    console.log(`Priority: ${data.priority}`);
  }
);

// Schedule periodic check for due soon tasks (every 5 minutes)
setInterval(() => {
  void (async () => {
    try {
      const ownerIds = await taskRepository.getDistinctOwnerIds();

      await Promise.all(
        ownerIds.map((ownerId) => checkDueSoonTasksUseCase.execute(ownerId))
      );
      // TODO: Replace with a dedicated multi-tenant scheduler when an owner registry is available.
    } catch (error) {
      console.error('Error checking due soon tasks:', error);
    }
  })();
}, 5 * 60 * 1000);

// Create the Elysia app
const app = new Elysia()
  .use(cors())
  .use(errorHandler)
  .use(authMiddlewareForTasks)
  .get('/health', () => ({
    success: true,
    message: 'Task Manager API is running',
    timestamp: new Date().toISOString(),
  }))
  .use(createTaskRoutes(container.taskController));

// Try to dynamically import an OpenAPI plugin and register it if available.
// This keeps the code safe if the dependency isn't present in some environments.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
try {
  // Attempt a dynamic import; allow different export shapes from community plugins.
  const openapiModule = (await import('@elysiajs/openapi').catch(() => null)) as any;
  const openapi = openapiModule?.default ?? openapiModule?.openapi ?? openapiModule?.swagger ?? openapiModule;
  if (openapi && typeof openapi === 'function') {
    // Plugin API may vary; call with a conservative options object.
    app.use(openapi({
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'Auto-generated API docs',
      docsPath: '/api/docs',
      specPath: '/api/openapi.json',
    }));
    console.log('📚 OpenAPI plugin registered at /api/docs');
    try {
      if (typeof (app as any).getGlobalRoutes === 'function') {
        const routes = (app as any).getGlobalRoutes();
        console.log('Registered routes:', routes.map((r: any) => r.path).slice(0, 200));
      }
    } catch (e) {
      console.warn('Could not list routes:', e);
    }
    // Register a lightweight Swagger UI renderer if available. Some plugin
    // packages expose a separate `swagger` entry that returns an HTML renderer
    // (not the full middleware). We register a simple GET route that returns
    // the renderer HTML pointing to the generated spec.
    try {
      // Build a small HTML page that includes a header input and initializes
      // Swagger UI from CDN. We attach a requestInterceptor that reads the
      // value from the input and sets the X-Telegram-Id header on each
      // outgoing request.
      const swaggerHtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Task Manager API</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css" />
      <style>body{margin:0;padding:1rem;font-family:sans-serif}#auth-bar{display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem}#auth-bar input{padding:0.5rem}#last-response{white-space:pre-wrap;border:1px solid #ddd;padding:0.5rem;margin-top:0.5rem;background:#fff}</style>
    </head>
    <body>
      <div id="auth-bar">
        <label for="x-telegram-id">X-Telegram-Id</label>
        <input id="x-telegram-id" placeholder="Telegram user id" />
        <button id="clear-x">Clear</button>
      </div>
      <div id="swagger-ui"></div>
      <div id="last-response" aria-live="polite"></div>
      <script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js" crossorigin></script>
      <script>
        (function(){
          const ui = SwaggerUIBundle({
            url: '/api/openapi.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
            layout: 'BaseLayout',
            requestInterceptor: function(req) {
              try {
                const val = document.getElementById('x-telegram-id')?.value;
                if (val) {
                  req.headers = req.headers || {};
                  req.headers['X-Telegram-Id'] = String(val);
                } else {
                  if (req.headers) delete req.headers['X-Telegram-Id'];
                }
              } catch (e) {
                // ignore
              }
              return req;
            },
            responseInterceptor: function(res) {
              try {
                const el = document.getElementById('last-response');
                if (!el) return res;
                // If the response has a parsed body, show it; otherwise try text()
                if (res && typeof res === 'object') {
                  if (res.body) {
                    el.textContent = JSON.stringify(res.body, null, 2);
                  } else if (typeof res.text === 'function') {
                    res.text().then(t => { el.textContent = t; }).catch(() => { el.textContent = String(res); });
                  } else {
                    el.textContent = JSON.stringify(res, null, 2);
                  }
                } else {
                  el.textContent = String(res);
                }
              } catch (e) {
                // ignore
              }
              return res;
            }
          });

          document.getElementById('clear-x')?.addEventListener('click', function(){
            const i = document.getElementById('x-telegram-id'); if(i) i.value = '';
          });
        })();
      </script>
    </body>
    </html>`;

      app.get('/api/docs', () => new Response(swaggerHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      console.log('✅ Swagger UI route (with X-Telegram-Id input) registered at /api/docs');
    } catch (e) {
      console.warn('Could not register swagger UI renderer:', e);
    }
  } else {
    console.log('ℹ️ OpenAPI plugin not found or incompatible; skipping docs registration');
  }
} catch (err) {
  console.warn('Could not register OpenAPI plugin:', err);
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

app.listen(config.PORT);

console.log(`🚀 Task Manager API is running at http://localhost:${app.server?.port}`);
console.log(`📊 Environment: ${config.NODE_ENV}`);
console.log(`🔍 Health check: http://localhost:${app.server?.port}/health`);

// Graceful shutdown
process.on('SIGINT', () => {
  void (async () => {
    console.log('\n👋 Shutting down gracefully...');
    await cacheService.disconnect();
    await queueService.disconnect();
    process.exit(0);
  })();
});

process.on('SIGTERM', () => {
  void (async () => {
    console.log('\n👋 Shutting down gracefully...');
    await cacheService.disconnect();
    await queueService.disconnect();
    process.exit(0);
  })();
});
