import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { IQueueService } from '../interfaces/IQueueService';
import { config } from '../../shared/config';

export class CheckDueSoonTasksUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private queueService: IQueueService
  ) {}

  async execute(ownerId: number): Promise<void> {
    const dueSoonTasks = await this.taskRepository.findDueSoonTasks(
      ownerId,
      config.DUE_SOON_THRESHOLD_HOURS
    );

    for (const task of dueSoonTasks) {
      await this.queueService.enqueue(config.TASK_NOTIFICATION_QUEUE, {
        ownerId,
        taskId: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
      });
    }

    if (dueSoonTasks.length > 0) {
      console.log(
        `✅ Enqueued ${dueSoonTasks.length} due soon tasks for owner ${ownerId}`
      );
    }
  }
}
