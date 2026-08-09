import type { VercelRequest, VercelResponse } from '@vercel/node';
import { triggerMakeWebhook } from '../lib/make/webhook';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS Preflight if called from standard browser fetches
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    const result = await triggerMakeWebhook(payload);
    
    return res.status(200).json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error('Automation webhook error:', error);
    return res.status(500).json({ 
      error: error?.message || 'Failed to trigger automation' 
    });
  }
}