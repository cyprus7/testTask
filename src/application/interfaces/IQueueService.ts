export interface IQueueService {
  enqueue(queueName: string, data: any): Promise<void>;
  process(queueName: string, handler: (data: any) => Promise<void>): void;
}
