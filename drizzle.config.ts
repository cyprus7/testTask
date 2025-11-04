import type { Config } from 'drizzle-kit';

export default {
  schema: './apps/api/app/api/src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/taskmanager',
  },
} satisfies Config;
