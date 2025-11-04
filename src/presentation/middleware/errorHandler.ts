import { Elysia } from 'elysia';
import { AppError } from '../../shared/errors';

export const errorHandler = (app: Elysia) =>
  app.onError(({ error, set }) => {
    console.error('Error:', error);

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
    if (error.name === 'ZodError') {
      set.status = 400;
      return {
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          details: error.errors,
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
