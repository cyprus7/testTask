import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { ICacheService } from '../interfaces/ICacheService';
import { NotFoundError } from '../../shared/errors';

export class DeleteTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.taskRepository.delete(id);
    
    if (!deleted) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }
    
    // Invalidate cache
    await this.cacheService.delete(`task:${id}`);
    await this.cacheService.delete('tasks:all');
  }
}
