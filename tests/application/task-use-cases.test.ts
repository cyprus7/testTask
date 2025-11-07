import { describe, expect, it } from 'bun:test';
import { CreateTaskUseCase } from '../../apps/api/src/application/use-cases/CreateTaskUseCase';
import { UpdateTaskUseCase } from '../../apps/api/src/application/use-cases/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '../../apps/api/src/application/use-cases/DeleteTaskUseCase';
import {
  Task,
  TaskPriority,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '../../apps/api/src/domain/entities/Task';
import { ITaskRepository, TaskFilters } from '../../apps/api/src/domain/repositories/ITaskRepository';
import { ICacheService } from '../../apps/api/src/application/interfaces/ICacheService';
import { NotFoundError } from '../../apps/api/src/shared/errors';

class InMemoryTaskRepository implements ITaskRepository {
  private tasks = new Map<string, Task>();
  private idCounter = 0;

  async create(task: CreateTaskInput & { ownerId: number }): Promise<Task> {
    const now = new Date();
    const createdTask: Task = {
      id: `task-${++this.idCounter}`,
      createdAt: now,
      updatedAt: now,
      ...task,
    };

    this.tasks.set(createdTask.id, createdTask);
    return createdTask;
  }

  async findById(ownerId: number, id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    if (!task || task.ownerId !== ownerId) {
      return null;
    }

    return task;
  }

  async findAll(ownerId: number, filters?: TaskFilters): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) => {
      if (task.ownerId !== ownerId) {
        return false;
      }

      if (filters?.status && task.status !== filters.status) {
        return false;
      }

      if (filters?.priority && task.priority !== filters.priority) {
        return false;
      }

      if (filters?.dueDateFrom && (!task.dueDate || task.dueDate < filters.dueDateFrom)) {
        return false;
      }

      if (filters?.dueDateTo && (!task.dueDate || task.dueDate > filters.dueDateTo)) {
        return false;
      }

      return true;
    });
  }

  async update(ownerId: number, id: string, task: UpdateTaskInput): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing || existing.ownerId !== ownerId) {
      return null;
    }

    const updatedTask: Task = {
      ...existing,
      ...task,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async delete(ownerId: number, id: string): Promise<boolean> {
    const existing = this.tasks.get(id);
    if (!existing || existing.ownerId !== ownerId) {
      return false;
    }

    return this.tasks.delete(id);
  }

  async findDueSoonTasks(ownerId: number, hours: number): Promise<Task[]> {
    const now = Date.now();
    const threshold = hours * 60 * 60 * 1000;

    return Array.from(this.tasks.values()).filter((task) => {
      if (task.ownerId !== ownerId || !task.dueDate) {
        return false;
      }

      const dueTime = task.dueDate.getTime();
      return dueTime >= now && dueTime <= now + threshold;
    });
  }

  async getDistinctOwnerIds(): Promise<number[]> {
    return Array.from(new Set(Array.from(this.tasks.values()).map((task) => task.ownerId)));
  }
}

class FakeCacheService implements ICacheService {
  deletedKeys: string[] = [];

  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set(_key: string, _value: any, _ttl?: number): Promise<void> { }

  async delete(key: string): Promise<void> {
    this.deletedKeys.push(key);
  }

  async clear(): Promise<void> {
    this.deletedKeys.push('*');
  }
}

const baseTaskInput: Omit<CreateTaskInput, 'ownerId'> = {
  title: 'Initial task',
  description: 'A sample task',
  status: TaskStatus.PENDING,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
};

describe('Task use cases', () => {
  it('creates a task and invalidates the cached task list', async () => {
    const repository = new InMemoryTaskRepository();
    const cache = new FakeCacheService();
    const createTask = new CreateTaskUseCase(repository, cache);
    const ownerId = 123;

    const task = await createTask.execute(ownerId, baseTaskInput);

    expect(task.id).toBeDefined();
    expect(cache.deletedKeys).toContain(`task:${ownerId}:${task.id}`);
    expect(cache.deletedKeys).toContain(`tasks:all:${ownerId}:${JSON.stringify({})}`);
  });

  it('throws a NotFoundError when updating a non-existent task', async () => {
    const repository = new InMemoryTaskRepository();
    const cache = new FakeCacheService();
    const updateTask = new UpdateTaskUseCase(repository, cache);
    const ownerId = 456;

    try {
      await updateTask.execute(ownerId, 'missing-task', { title: 'Updated title' });
      // If no error was thrown, fail the test
      throw new Error('Expected NotFoundError to be thrown');
    } catch (err) {
      expect((err as Error).constructor).toBe(NotFoundError);
    }
  });

  it('updates an existing task and invalidates related cache entries', async () => {
    const repository = new InMemoryTaskRepository();
    const cache = new FakeCacheService();
    const createTask = new CreateTaskUseCase(repository, cache);
    const updateTask = new UpdateTaskUseCase(repository, cache);
    const ownerId = 789;

    const existing = await createTask.execute(ownerId, baseTaskInput);

    const updated = await updateTask.execute(ownerId, existing.id, {
      status: TaskStatus.COMPLETED,
    });

    expect(updated.status).toBe(TaskStatus.COMPLETED);
    expect(cache.deletedKeys).toContain(`task:${ownerId}:${existing.id}`);
    expect(cache.deletedKeys).toContain(`tasks:all:${ownerId}:${JSON.stringify({})}`);
  });

  it('deletes an existing task and invalidates cache entries', async () => {
    const repository = new InMemoryTaskRepository();
    const cache = new FakeCacheService();
    const createTask = new CreateTaskUseCase(repository, cache);
    const deleteTask = new DeleteTaskUseCase(repository, cache);
    const ownerId = 321;

    const existing = await createTask.execute(ownerId, baseTaskInput);
    await deleteTask.execute(ownerId, existing.id);

    expect(cache.deletedKeys).toContain(`task:${ownerId}:${existing.id}`);
    expect(cache.deletedKeys).toContain(`tasks:all:${ownerId}:${JSON.stringify({})}`);
  });
});
