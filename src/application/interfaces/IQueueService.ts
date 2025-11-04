export interface IQueueService {
  enqueue<T>(queueName: string, data: T): Promise<void>;
  process<T>(queueName: string, handler: (data: T) => void | Promise<void>): void;
}
