import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from 'drizzle-kit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: Config = {
  schema: resolve(__dirname, './src/infrastructure/database/schema.ts'),
  out: resolve(__dirname, './drizzle'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/taskmanager',
  },
};

export default config;
