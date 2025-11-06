import { Elysia, t } from 'elysia';
import { TaskController } from '../controllers/TaskController';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '../../application/dtos/TaskDTO';
import { UnauthorizedError } from '../../shared/errors';

const requireOwnerId = (ctx: unknown): number => {
  const maybeUserId = (ctx as { userId?: unknown })?.userId;
  if (typeof maybeUserId !== 'number') {
    throw new UnauthorizedError();
  }

  return maybeUserId;
};

export const createTaskRoutes = (controller: TaskController) =>
  new Elysia({ prefix: '/tasks' })
    .get('/', async (ctx) => {
      const ownerId = requireOwnerId(ctx);
      const validated = TaskQuerySchema.parse(ctx.query);
      const tasks = await controller.getTasks(ownerId, validated);
      return {
        success: true,
        data: tasks,
      };
    })
    .get('/:id', async (ctx) => {
      const ownerId = requireOwnerId(ctx);
      const { id } = ctx.params;
      const task = await controller.getTaskById(ownerId, id);
      return {
        success: true,
        data: task,
      };
    })
    .post('/', async (ctx) => {
      const ownerId = requireOwnerId(ctx);
      const validated = CreateTaskSchema.parse(ctx.body);
      const task = await controller.createTask(ownerId, validated);
      return {
        success: true,
        data: task,
      };
    }, {
      body: t.Object({
        title: t.String(),
        description: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        dueDate: t.Optional(t.Nullable(t.String())),
      }),
    })
    .put('/:id', async (ctx) => {
      const ownerId = requireOwnerId(ctx);
      const { id } = ctx.params;
      const validated = UpdateTaskSchema.parse(ctx.body);
      const task = await controller.updateTask(ownerId, id, validated);
      return {
        success: true,
        data: task,
      };
    }, {
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        dueDate: t.Optional(t.Nullable(t.String())),
      }),
    })
    .delete('/:id', async (ctx) => {
      const ownerId = requireOwnerId(ctx);
      const { id } = ctx.params;
      await controller.deleteTask(ownerId, id);
      return {
        success: true,
        message: 'Task deleted successfully',
      };
    });
