import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task, CreateTaskInput } from '../../domain/entities/Task';
import { ICacheService } from '../interfaces/ICacheService';

export class CreateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const task = await this.taskRepository.create(input);
    
    // Invalidate cache
    await this.cacheService.delete('tasks:all');
    
    return task;
  }
}
