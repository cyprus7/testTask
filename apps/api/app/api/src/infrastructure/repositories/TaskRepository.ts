import { eq, and, gte, lte } from 'drizzle-orm';
import { ITaskRepository, TaskFilters } from '../../domain/repositories/ITaskRepository';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../../domain/entities/Task';
import { db } from '../database/connection';
import { tasks } from '../database/schema';

export class TaskRepository implements ITaskRepository {
  async create(input: CreateTaskInput): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
    }).returning();

    return this.mapToTask(task);
  }

  async findById(id: string): Promise<Task | null> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task ? this.mapToTask(task) : null;
  }

  async findAll(filters?: TaskFilters): Promise<Task[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as TaskStatus));
    }
    if (filters?.priority) {
      conditions.push(eq(tasks.priority, filters.priority as TaskPriority));
    }
    if (filters?.dueDateFrom) {
      conditions.push(gte(tasks.dueDate, filters.dueDateFrom));
    }
    if (filters?.dueDateTo) {
      conditions.push(lte(tasks.dueDate, filters.dueDateTo));
    }

    const query = conditions.length > 0
      ? db.select().from(tasks).where(and(...conditions))
      : db.select().from(tasks);

    const result = await query;
    return result.map((r) => this.mapToTask(r));
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const updateData: Partial<Record<string, unknown>> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;

    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    return task ? this.mapToTask(task) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async findDueSoonTasks(hours: number): Promise<Task[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.dueDate, now),
          lte(tasks.dueDate, threshold),
          eq(tasks.status, TaskStatus.PENDING)
        )
      );

    return result.map((r) => this.mapToTask(r));
  }

  private mapToTask(record: Record<string, unknown> | undefined): Task {
    const rec: Record<string, unknown> = record ?? {};
    return {
      id: rec.id as string,
      title: rec.title as string,
      description: (rec.description as string) ?? null,
      status: rec.status as TaskStatus,
      priority: rec.priority as TaskPriority,
      dueDate: (rec.dueDate as Date) ?? null,
      createdAt: rec.createdAt as Date,
      updatedAt: rec.updatedAt as Date,
    };
  }
}
