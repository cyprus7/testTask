import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../entities/Task';

export interface ITaskRepository {
  create(task: CreateTaskInput): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(filters?: TaskFilters): Promise<Task[]>;
  update(id: string, task: UpdateTaskInput): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  findDueSoonTasks(hours: number): Promise<Task[]>;
}

export interface TaskFilters {
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}
