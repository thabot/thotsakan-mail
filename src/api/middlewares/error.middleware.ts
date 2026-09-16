import type { Context } from 'hono';

export function errorHandler(err: Error, c: Context) {
  console.error('Unhandled Application Error:', err);
  return c.json(
    {
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    },
    500
  );
}
