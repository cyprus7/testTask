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

    if (!value || Number.isNaN(userId) || !Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedError('Unauthorized');
    }

    return { userId };
  });
