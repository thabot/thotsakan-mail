import { Hono } from 'hono';
import { renderWebUI } from './console.html.js';

export function createWebUIRoute() {
  const app = new Hono();

  app.get('/', (c) => {
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.html(renderWebUI());
  });

  app.get('/console', (c) => {
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.html(renderWebUI());
  });

  return app;
}
