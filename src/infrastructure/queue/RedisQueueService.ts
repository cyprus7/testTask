import { createClient } from 'redis';
import { IQueueService } from '../../application/interfaces/IQueueService';
import { config } from '../../shared/config';

export class RedisQueueService implements IQueueService {
  private client: ReturnType<typeof createClient>;
  private connected: boolean = false;
  private processing: Map<string, boolean> = new Map();

  constructor() {
    this.client = createClient({
      socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
    });

    this.client.on('error', (err) => console.error('Redis Queue Error:', err));
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async enqueue<T>(queueName: string, data: T): Promise<void> {
    await this.connect();
    const serialized = JSON.stringify(data);
    await this.client.rPush(queueName, serialized);
  }

  process<T>(queueName: string, handler: (data: T) => void | Promise<void>): void {
    if (this.processing.get(queueName)) {
      return; // Already processing this queue
    }

    this.processing.set(queueName, true);
    void this.processQueue(queueName, handler);
  }

  private async processQueue<T>(queueName: string, handler: (data: T) => void | Promise<void>) {
    await this.connect();

    while (this.processing.get(queueName)) {
      try {
        const item = await this.client.blPop(queueName, 5);

        if (item) {
          const data = JSON.parse(item.element) as unknown as T;
          // handler may be sync or async
          await Promise.resolve(handler(data));
        }
      } catch (error) {
        console.error(`Error processing queue ${queueName}:`, error);
        // Continue processing
      }
    }
  }

  stopProcessing(queueName: string) {
    this.processing.set(queueName, false);
  }

  async disconnect() {
    // Stop all processing
    this.processing.forEach((_, key) => this.processing.set(key, false));

    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}
