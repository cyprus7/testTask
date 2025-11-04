import { TaskRepository } from '../infrastructure/repositories/TaskRepository';
import { RedisCacheService } from '../infrastructure/cache/RedisCacheService';
import { RedisQueueService } from '../infrastructure/queue/RedisQueueService';
import { CreateTaskUseCase } from '../application/use-cases/CreateTaskUseCase';
import { GetTasksUseCase } from '../application/use-cases/GetTasksUseCase';
import { GetTaskByIdUseCase } from '../application/use-cases/GetTaskByIdUseCase';
import { UpdateTaskUseCase } from '../application/use-cases/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '../application/use-cases/DeleteTaskUseCase';
import { CheckDueSoonTasksUseCase } from '../application/use-cases/CheckDueSoonTasksUseCase';
import { TaskController } from '../presentation/controllers/TaskController';

export class Container {
  // Infrastructure
  private taskRepository = new TaskRepository();
  private cacheService = new RedisCacheService();
  private queueService = new RedisQueueService();

  // Use Cases
  private createTaskUseCase = new CreateTaskUseCase(
    this.taskRepository,
    this.cacheService
  );
  
  private getTasksUseCase = new GetTasksUseCase(
    this.taskRepository,
    this.cacheService
  );
  
  private getTaskByIdUseCase = new GetTaskByIdUseCase(
    this.taskRepository,
    this.cacheService
  );
  
  private updateTaskUseCase = new UpdateTaskUseCase(
    this.taskRepository,
    this.cacheService
  );
  
  private deleteTaskUseCase = new DeleteTaskUseCase(
    this.taskRepository,
    this.cacheService
  );
  
  private checkDueSoonTasksUseCase = new CheckDueSoonTasksUseCase(
    this.taskRepository,
    this.queueService
  );

  // Controllers
  public taskController = new TaskController(
    this.createTaskUseCase,
    this.getTasksUseCase,
    this.getTaskByIdUseCase,
    this.updateTaskUseCase,
    this.deleteTaskUseCase
  );

  // Services
  public getCacheService() {
    return this.cacheService;
  }

  public getQueueService() {
    return this.queueService;
  }

  public getCheckDueSoonTasksUseCase() {
    return this.checkDueSoonTasksUseCase;
  }
}

export const container = new Container();
