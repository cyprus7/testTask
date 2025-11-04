import { describe, expect, it } from 'bun:test';
import { CreateTaskUseCase } from '../../apps/api/app/api/src/application/use-cases/CreateTaskUseCase';
import { UpdateTaskUseCase } from '../../apps/api/app/api/src/application/use-cases/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '../../apps/api/app/api/src/application/use-cases/DeleteTaskUseCase';
import {
  Task,
  TaskPriority,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '../../apps/api/app/api/src/domain/entities/Task';
import { ITaskRepository, TaskFilters } from '../../apps/api/app/api/src/domain/repositories/ITaskRepository';
import { ICacheService } from '../../apps/api/app/api/src/application/interfaces/ICacheService';
import { NotFoundError } from '../../apps/api/app/api/src/shared/errors';

class InMemoryTaskRepository implements ITaskRepository {
  private tasks = new Map<string, Task>();
  private idCounter = 0;

  async create(task: CreateTaskInput): Promise<Task> {
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

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async findAll(_filters?: TaskFilters): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async update(id: string, task: UpdateTaskInput): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) {
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

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async findDueSoonTasks(hours: number): Promise<Task[]> {
    const now = Date.now();
    const threshold = hours * 60 * 60 * 1000;

    return Array.from(this.tasks.values()).filter((task) => {
      if (!task.dueDate) {
        return false;
      }

      const dueTime = task.dueDate.getTime();
      return dueTime >= now && dueTime <= now + threshold;
    });
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

const baseTaskInput: CreateTaskInput = {
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

    const task = await createTask.execute(baseTaskInput);

    expect(task.id).toBeDefined();
    expect(cache.deletedKeys).toContain('tasks:all');
  });

  it('throws a NotFoundError when updating a non-existent task', async () => {
    const repository = new InMemoryTaskRepository();
    const cache = new FakeCacheService();
    const updateTask = new UpdateTaskUseCase(repository, cache);

    await expect(
      updateTask.execute('missing-task', { title: 'Updated title' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates an existing task and invalidates related cache entries', async () => {
    const repository = new InMemoryTaskRepository();
    const cache = new FakeCacheService();
    const createTask = new CreateTaskUseCase(repository, cache);
    const updateTask = new UpdateTaskUseCase(repository, cache);

    const existing = await createTask.execute(baseTaskInput);

    const updated = await updateTask.execute(existing.id, {
      status: TaskStatus.COMPLETED,
    });

    expect(updated.status).toBe(TaskStatus.COMPLETED);
    expect(cache.deletedKeys).toContain(`task:${existing.id}`);
    expect(cache.deletedKeys).toContain('tasks:all');
  });

  it('deletes an existing task and invalidates cache entries', async () => {
    const repository = new InMemoryTaskRepository();
    const cache = new FakeCacheService();
    const createTask = new CreateTaskUseCase(repository, cache);
    const deleteTask = new DeleteTaskUseCase(repository, cache);

    const existing = await createTask.execute(baseTaskInput);
    await deleteTask.execute(existing.id);

    expect(cache.deletedKeys).toContain(`task:${existing.id}`);
    expect(cache.deletedKeys).toContain('tasks:all');
  });
});
