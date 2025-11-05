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

  async createTask(data: CreateTaskDTO) {
    const payload = {
      ...data,
      description: data.description ?? null,
      dueDate: data.dueDate ?? null,
    };

    return await this.createTaskUseCase.execute(payload);
  }

  async getTasks(query: TaskQueryDTO) {
    return await this.getTasksUseCase.execute(query);
  }

  async getTaskById(id: string) {
    return await this.getTaskByIdUseCase.execute(id);
  }

  async updateTask(id: string, data: UpdateTaskDTO) {
    return await this.updateTaskUseCase.execute(id, data);
  }

  async deleteTask(id: string) {
    await this.deleteTaskUseCase.execute(id);
  }
}
