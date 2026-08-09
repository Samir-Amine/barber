import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ALLOWED_ACTIONS, ALLOWED_ENTITIES } from './lib/make/config';
import { triggerMakeWebhook } from './lib/make/webhook';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Secure Server-side Make Automation Webhook Route
  app.post('/api/automation', async (req, res) => {
    try {
      const { entity, action, record_id, actor, data } = req.body;

      if (!entity || !ALLOWED_ENTITIES.includes(entity)) {
        res.status(400).json({ error: 'Invalid entity provided.' });
        return;
      }

      if (!action || !ALLOWED_ACTIONS.includes(action)) {
        res.status(400).json({ error: 'Invalid action provided.' });
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
      res.status(500).json({ error: err.message || 'Server error processing automation' });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Barbershop Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
