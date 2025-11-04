import { Elysia, t } from 'elysia';
import { TaskController } from '../controllers/TaskController';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '../../application/dtos/TaskDTO';

export const createTaskRoutes = (controller: TaskController) =>
  new Elysia({ prefix: '/tasks' })
    .get('/', async ({ query }) => {
      const validated = TaskQuerySchema.parse(query);
      const tasks = await controller.getTasks(validated);
      return {
        success: true,
        data: tasks,
      };
    })
    .get('/:id', async ({ params: { id } }) => {
      const task = await controller.getTaskById(id);
      return {
        success: true,
        data: task,
      };
    })
    .post('/', async ({ body }) => {
      const validated = CreateTaskSchema.parse(body);
      const task = await controller.createTask(validated);
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
    .put('/:id', async ({ params: { id }, body }) => {
      const validated = UpdateTaskSchema.parse(body);
      const task = await controller.updateTask(id, validated);
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
    .delete('/:id', async ({ params: { id } }) => {
      await controller.deleteTask(id);
      return {
        success: true,
        message: 'Task deleted successfully',
      };
    });
