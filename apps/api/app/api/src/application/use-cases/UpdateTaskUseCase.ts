import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task, UpdateTaskInput } from '../../domain/entities/Task';
import { ICacheService } from '../interfaces/ICacheService';
import { NotFoundError } from '../../shared/errors';

export class UpdateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(id: string, input: UpdateTaskInput): Promise<Task> {
    const task = await this.taskRepository.update(id, input);
    
    if (!task) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }
    
    // Invalidate cache
    await this.cacheService.delete(`task:${id}`);
    await this.cacheService.delete('tasks:all');
    
    return task;
  }
}
