import { Hono } from 'hono';
import type { Database } from 'bun:sqlite';
import { EmailLogRepository } from '../../database/repositories/email-log.repository.js';

// Base64-encoded 1x1 transparent GIF (43 bytes)
const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export function createTrackingRoute(db: Database) {
  const app = new Hono();
  const logRepo = new EmailLogRepository(db);

  // 1. GET /v1/track/open/:jobId - Open tracking pixel
  app.get('/v1/track/open/:jobId', (c) => {
    const jobId = c.req.param('jobId');

    try {
      logRepo.recordOpen(jobId);
    } catch (err: any) {
      console.warn(`[TrackingRoute] Failed to record open for ${jobId}:`, err.message);
    }

    c.header('Content-Type', 'image/gif');
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

    return c.body(TRANSPARENT_1X1_GIF);
  });

  // 2. GET /v1/track/click/:jobId - Click tracking redirect
  app.get('/v1/track/click/:jobId', (c) => {
    const jobId = c.req.param('jobId');
    const targetUrl = c.req.query('url');

    if (!targetUrl) {
      return c.text('Missing target url query parameter', 400);
    }

    try {
      logRepo.recordClick(jobId);
    } catch (err: any) {
      console.warn(`[TrackingRoute] Failed to record click for ${jobId}:`, err.message);
    }

    // HTTP 302 Temporary Redirect to target destination
    return c.redirect(targetUrl, 302);
  });

  return app;
}
