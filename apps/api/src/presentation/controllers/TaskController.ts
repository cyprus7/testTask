import { CreateTaskUseCase } from '../../application/use-cases/CreateTaskUseCase';
import { GetTasksUseCase } from '../../application/use-cases/GetTasksUseCase';
import { GetTaskByIdUseCase } from '../../application/use-cases/GetTaskByIdUseCase';
import { UpdateTaskUseCase } from '../../application/use-cases/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '../../application/use-cases/DeleteTaskUseCase';
import { CreateTaskDTO, UpdateTaskDTO, TaskQueryDTO } from '../../application/dtos/TaskDTO';

export class TaskController {
  constructor(
    private createTaskUseCase: CreateTaskUseCase,
    private getTasksUseCase: GetTasksUseCase,
    private getTaskByIdUseCase: GetTaskByIdUseCase,
    private updateTaskUseCase: UpdateTaskUseCase,
    private deleteTaskUseCase: DeleteTaskUseCase
  ) { }

  async createTask(ownerId: number, data: CreateTaskDTO) {
    const payload = {
      ...data,
      description: data.description ?? null,
      dueDate: data.dueDate ?? null,
    };

    return await this.createTaskUseCase.execute(ownerId, payload);
  }

  async getTasks(ownerId: number, query: TaskQueryDTO) {
    return await this.getTasksUseCase.execute(ownerId, query);
  }

  async getTaskById(ownerId: number, id: string) {
    return await this.getTaskByIdUseCase.execute(ownerId, id);
  }

  async updateTask(ownerId: number, id: string, data: UpdateTaskDTO) {
    return await this.updateTaskUseCase.execute(ownerId, id, data);
  }

  async deleteTask(ownerId: number, id: string) {
    await this.deleteTaskUseCase.execute(ownerId, id);
  }
}
