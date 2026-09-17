import { Hono } from 'hono';
import { createHmac } from 'node:crypto';
import type { Database } from 'bun:sqlite';
import { EmailLogRepository } from '../../database/repositories/email-log.repository.js';
import { SuppressionService } from '../../services/suppression.service.js';

export function createWebhooksRoute(db: Database) {
  const app = new Hono();
  const logRepo = new EmailLogRepository(db);
  const suppressionService = new SuppressionService(db);

  // 1. AWS SES Webhook (via AWS SNS Notification)
  app.post('/v1/webhooks/aws-ses', async (c) => {
    try {
      const body = await c.req.json();

      // Handle SNS Subscription Confirmation
      if (body.Type === 'SubscriptionConfirmation' && body.SubscribeURL) {
        console.log(`[Webhook AWS-SES] Subscription Confirmation URL: ${body.SubscribeURL}`);
        return c.json({ ok: true, message: 'Subscription confirmation received' });
      }

      if (body.Type === 'Notification' && body.Message) {
        const message = JSON.parse(body.Message);
        const eventType = message.eventType || message.notificationType;
        const mail = message.mail;

        if (eventType === 'Bounce') {
          const bounce = message.bounce;
          const bounceType = bounce?.bounceType; // 'Permanent' or 'Transient'
          const recipients = bounce?.bouncedRecipients?.map((r: any) => r.emailAddress) || [];

          for (const email of recipients) {
            if (bounceType === 'Permanent') {
              suppressionService.suppress(email, 'default_tenant', 'BOUNCE');
            }
          }
        } else if (eventType === 'Complaint') {
          const complaint = message.complaint;
          const recipients = complaint?.complainedRecipients?.map((r: any) => r.emailAddress) || [];
          for (const email of recipients) {
            suppressionService.suppress(email, 'default_tenant', 'SPAM');
          }
        }

        return c.json({ ok: true, received: eventType });
      }

      return c.json({ ok: true });
    } catch (err: any) {
      return c.json({ error: `Webhook processing error: ${err.message}` }, 400);
    }
  });

  // 2. Resend Webhook (Svix HMAC-SHA256 signature verification)
  app.post('/v1/webhooks/resend', async (c) => {
    try {
      const svixId = c.req.header('svix-id');
      const svixTimestamp = c.req.header('svix-timestamp');
      const svixSignature = c.req.header('svix-signature');
      const rawBody = await c.req.text();

      // If webhook secret configured, verify signature
      const secret = process.env.RESEND_WEBHOOK_SECRET;
      if (secret && svixId && svixTimestamp && svixSignature) {
        const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
        const computed = createHmac('sha256', secret).update(toSign).digest('base64');
        const expectedSig = `v1,${computed}`;
        if (!svixSignature.includes(computed)) {
          return c.json({ error: 'Invalid webhook signature' }, 401);
        }
      }

      const payload = JSON.parse(rawBody);
      const eventType = payload.type;
      const data = payload.data;

      if (eventType === 'email.bounced') {
        const email = data?.to?.[0];
        if (email) {
          suppressionService.suppress(email, 'default_tenant', 'BOUNCE');
        }
      } else if (eventType === 'email.complained') {
        const email = data?.to?.[0];
        if (email) {
          suppressionService.suppress(email, 'default_tenant', 'SPAM');
        }
      }

      return c.json({ ok: true, type: eventType });
    } catch (err: any) {
      return c.json({ error: `Resend webhook error: ${err.message}` }, 400);
    }
  });

  // 3. SendGrid Webhook
  app.post('/v1/webhooks/sendgrid', async (c) => {
    try {
      const events = await c.req.json();
      if (!Array.isArray(events)) {
        return c.json({ error: 'Expected array of events' }, 400);
      }

      for (const ev of events) {
        const email = ev.email;
        if (!email) continue;

        if (ev.event === 'bounce' || ev.event === 'dropped') {
          suppressionService.suppress(email, 'default_tenant', 'BOUNCE');
        } else if (ev.event === 'spamreport') {
          suppressionService.suppress(email, 'default_tenant', 'SPAM');
        } else if (ev.event === 'unsubscribe') {
          suppressionService.suppress(email, 'default_tenant', 'UNSUBSCRIBE');
        }
      }

      return c.json({ ok: true, processed: events.length });
    } catch (err: any) {
      return c.json({ error: `SendGrid webhook error: ${err.message}` }, 400);
    }
  });

  return app;
}
