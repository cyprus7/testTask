import { eq, and, gte, lte } from 'drizzle-orm';
import { ITaskRepository, TaskFilters } from '../../domain/repositories/ITaskRepository';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../../domain/entities/Task';
import { db } from '../database/connection';
import { tasks } from '../database/schema';

export class TaskRepository implements ITaskRepository {
  async create(input: CreateTaskInput & { ownerId: number }): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      ownerId: input.ownerId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
    }).returning();

    return this.mapToTask(task);
  }

  async findById(ownerId: number, id: string): Promise<Task | null> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.ownerId, ownerId), eq(tasks.id, id)));
    return task ? this.mapToTask(task) : null;
  }

  async findAll(ownerId: number, filters?: TaskFilters): Promise<Task[]> {
    const conditions = [eq(tasks.ownerId, ownerId)];

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

    const query = conditions.length > 1
      ? db.select().from(tasks).where(and(...conditions))
      : db.select().from(tasks).where(conditions[0]);

    const result = await query;
    return result.map((r) => this.mapToTask(r));
  }

  async update(ownerId: number, id: string, input: UpdateTaskInput): Promise<Task | null> {
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
      .where(and(eq(tasks.ownerId, ownerId), eq(tasks.id, id)))
      .returning();

    return task ? this.mapToTask(task) : null;
  }

  async delete(ownerId: number, id: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.ownerId, ownerId), eq(tasks.id, id)))
      .returning();
    return result.length > 0;
  }

  async findDueSoonTasks(ownerId: number, hours: number): Promise<Task[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.ownerId, ownerId),
          gte(tasks.dueDate, now),
          lte(tasks.dueDate, threshold),
          eq(tasks.status, TaskStatus.PENDING)
        )
      );

    return result.map((r) => this.mapToTask(r));
  }

  async getDistinctOwnerIds(): Promise<number[]> {
    const rows = await db.selectDistinct({ ownerId: tasks.ownerId }).from(tasks);
    return rows
      .map((row) => Number(row.ownerId))
      .filter((ownerId) => Number.isSafeInteger(ownerId) && ownerId > 0);
  }

  private mapToTask(record: Record<string, unknown> | undefined): Task {
    const rec: Record<string, unknown> = record ?? {};
    return {
      id: rec.id as string,
      ownerId: Number(rec.ownerId),
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
