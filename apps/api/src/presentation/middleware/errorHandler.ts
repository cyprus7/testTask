import { Elysia } from 'elysia';
import { AppError } from '../../shared/errors';
import { ZodError } from 'zod';

export const errorHandler = (app: Elysia) => {
  app.onError(({ error, set }) => {
    // Print full error and stack when available to aid diagnostics in containers
    console.error('Error:', error);
    if ((error as any)?.stack) {
      console.error('Stack:', (error as any).stack);
    }

    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
        },
      };
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      set.status = 400;
      return {
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          details: error.issues,
        },
      };
    }

    // Default error
    set.status = 500;
    return {
      success: false,
      error: {
        message: 'Internal server error',
        statusCode: 500,
      },
    };
  });

  return app;
};
