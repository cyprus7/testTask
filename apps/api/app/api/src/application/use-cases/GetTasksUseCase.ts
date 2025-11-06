import { ITaskRepository, TaskFilters } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { ICacheService } from '../interfaces/ICacheService';

export class GetTasksUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(ownerId: number, filters?: TaskFilters): Promise<Task[]> {
    const cacheKey = `tasks:all:${ownerId}:${JSON.stringify(filters || {})}`;

    // Try to get from cache
    const cached = await this.cacheService.get<Task[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const tasks = await this.taskRepository.findAll(ownerId, filters);

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, tasks, 300);

    return tasks;
  }
}
