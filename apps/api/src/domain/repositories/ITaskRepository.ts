import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../entities/Task';

export interface ITaskRepository {
  create(task: CreateTaskInput & { ownerId: number }): Promise<Task>;
  findById(ownerId: number, id: string): Promise<Task | null>;
  findAll(ownerId: number, filters?: TaskFilters): Promise<Task[]>;
  update(ownerId: number, id: string, task: UpdateTaskInput): Promise<Task | null>;
  delete(ownerId: number, id: string): Promise<boolean>;
  findDueSoonTasks(ownerId: number, hours: number): Promise<Task[]>;
  getDistinctOwnerIds(): Promise<number[]>;
}

export interface TaskFilters {
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}
