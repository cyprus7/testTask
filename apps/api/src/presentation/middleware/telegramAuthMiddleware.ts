import { Elysia } from 'elysia';
import { UnauthorizedError } from '../../shared/errors';

export const authMiddlewareForTasks = (app: Elysia) =>
  app.derive(({ request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    if (!pathname.startsWith('/tasks') || method === 'OPTIONS') {
      return {};
    }

    const header = request.headers.get('x-telegram-id');
    const value = header?.trim();
    const userId = value ? Number(value) : NaN;

    // Allow an explicit development bypass via env var so local/dev runs and
    // automated health/migration checks don't fail when the header is absent.
    const bypass = process.env.TELEGRAM_AUTH_BYPASS === '1' || process.env.TELEGRAM_AUTH_BYPASS === 'true';
    if (!value || Number.isNaN(userId) || !Number.isSafeInteger(userId) || userId <= 0) {
      if (bypass) {
        return {} as any;
      }

      throw new UnauthorizedError('Unauthorized');
    }

    return { userId };
  });
