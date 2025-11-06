import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task, CreateTaskInput } from '../../domain/entities/Task';
import { ICacheService } from '../interfaces/ICacheService';

export class CreateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(ownerId: number, input: Omit<CreateTaskInput, 'ownerId'>): Promise<Task> {
    const payload: CreateTaskInput & { ownerId: number } = {
      ...input,
      ownerId,
    };

    const task = await this.taskRepository.create(payload);

    const itemCacheKey = `task:${ownerId}:${task.id}`;
    const listCacheKey = `tasks:all:${ownerId}:${JSON.stringify({})}`;

    await Promise.all([
      this.cacheService.delete(itemCacheKey),
      this.cacheService.delete(listCacheKey),
    ]);

    return task;
  }
}
