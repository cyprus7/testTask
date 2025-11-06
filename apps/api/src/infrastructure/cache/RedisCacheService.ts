import { createClient } from 'redis';
import { ICacheService } from '../../application/interfaces/ICacheService';
import { config } from '../../shared/config';

export class RedisCacheService implements ICacheService {
  private client: ReturnType<typeof createClient>;
  private connected: boolean = false;

  constructor() {
    // Prefer URL-based configuration. `config.REDIS_URL` may be like
    // redis://host:6379/0 and is provided from secrets in production.
    this.client = createClient({
      url: config.REDIS_URL,
    });

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.connect();
    const value = await this.client.get(key);
    if (!value) return null;
    const parsed = JSON.parse(value) as unknown;
    return parsed as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.connect();
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.connect();
    await this.client.flushAll();
  }

  async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}
