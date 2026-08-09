import express from 'express';
import path from 'path';

import { ALLOWED_ACTIONS, ALLOWED_ENTITIES } from './lib/make/config';
import { triggerMakeWebhook } from './lib/make/webhook';

const app = express();

app.use(express.json());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Make automation webhook
app.post('/api/automation', async (req, res) => {
  try {
    const {
      entity,
      action,
      record_id,
      actor,
      data,
    } = req.body;

    if (!entity || !ALLOWED_ENTITIES.includes(entity)) {
      res.status(400).json({
        error: 'Invalid entity provided.',
      });
      return;
    }

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      res.status(400).json({
        error: 'Invalid action provided.',
      });
      return;
    }

    if (!record_id) {
      res.status(400).json({
        error: 'record_id is required.',
      });
      return;
    }

    const result = await triggerMakeWebhook({
      entity,
      action,
      record_id,
      actor,
      data,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Automation endpoint error:', err);

    res.status(500).json({
      error:
        err?.message ||
        'Server error processing automation',
    });
  }
});

// Development only:
// Vite middleware is useful when running the project locally.


// Export Express app for Vercel
export default app;