import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { ICacheService } from '../interfaces/ICacheService';
import { NotFoundError } from '../../shared/errors';

export class GetTaskByIdUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(ownerId: number, id: string): Promise<Task> {
    const cacheKey = `task:${ownerId}:${id}`;

    // Try to get from cache
    const cached = await this.cacheService.get<Task>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const task = await this.taskRepository.findById(ownerId, id);
    if (!task) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, task, 300);
    
    return task;
  }
}
