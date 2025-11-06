import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { ICacheService } from '../interfaces/ICacheService';
import { NotFoundError } from '../../shared/errors';

export class DeleteTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private cacheService: ICacheService
  ) {}

  async execute(ownerId: number, id: string): Promise<void> {
    const deleted = await this.taskRepository.delete(ownerId, id);

    if (!deleted) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }

    // Invalidate cache
    await Promise.all([
      this.cacheService.delete(`task:${ownerId}:${id}`),
      this.cacheService.delete(`tasks:all:${ownerId}:${JSON.stringify({})}`),
    ]);
  }
}
