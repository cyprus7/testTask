import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task, UpdateTaskInput } from '../../domain/entities/Task';
import { ICacheService } from '../interfaces/ICacheService';
import { NotFoundError } from '../../shared/errors';

export class UpdateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(ownerId: number, id: string, input: UpdateTaskInput): Promise<Task> {
    const task = await this.taskRepository.update(ownerId, id, input);

    if (!task) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }

    // Invalidate cache
    await Promise.all([
      this.cacheService.delete(`task:${ownerId}:${id}`),
      this.cacheService.delete(`tasks:all:${ownerId}:${JSON.stringify({})}`),
    ]);

    return task;
  }
}
