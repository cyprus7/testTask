import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // Use a single REDIS_URL (e.g. redis://host:6379/0). In production this will
  // be provided from a secret (similar to DATABASE_URL). Keep a sensible
  // local default for dev.
  REDIS_URL: z.string().url().default('redis://localhost:6379/0'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TASK_NOTIFICATION_QUEUE: z.string().default('task-notifications'),
  DUE_SOON_THRESHOLD_HOURS: z.coerce.number().default(24),
});

type Env = z.infer<typeof envSchema>;

function loadConfig(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((err: z.ZodIssue) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Failed to load configuration');
  }
}

export const config = loadConfig();
