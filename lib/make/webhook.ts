import {
  ALLOWED_ACTIONS,
  ALLOWED_ENTITIES,
  getMakeWebhookConfig,
  MakeAction,
  MakeEntity,
  MakeEventPayload,
} from './config';
import { getSupabaseServerClient } from '../supabase/server';

export async function triggerMakeWebhook(payload: {
  entity: string;
  action: string;
  record_id?: string | null;
  actor?: { id: string; role: string };
  data?: Record<string, unknown>;
}) {
  // Validate entity and action against allowlists
  if (!ALLOWED_ENTITIES.includes(payload.entity as MakeEntity)) {
    throw new Error(`Invalid entity "${payload.entity}" for Make automation event.`);
  }

  if (!ALLOWED_ACTIONS.includes(payload.action as MakeAction)) {
    throw new Error(`Invalid action "${payload.action}" for Make automation event.`);
  }

  const { webhookUrl, webhookSecret } = getMakeWebhookConfig();
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`;

  const eventPayload: MakeEventPayload = {
    entity: payload.entity as MakeEntity,
    action: payload.action as MakeAction,
    record_id: payload.record_id || null,
    actor: payload.actor || { id: 'system', role: 'system' },
    data: payload.data || {},
    request_id: requestId,
  };

  let responseStatus: number | null = null;
  let errorMessage: string | null = null;

  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Make-Webhook-Secret': webhookSecret,
        },
        body: JSON.stringify(eventPayload),
      });

      responseStatus = response.status;
      if (!response.ok) {
        errorMessage = `Webhook returned HTTP status ${response.status}: ${await response.text().catch(() => '')}`;
      }
    } catch (err: any) {
      errorMessage = err.message || 'Failed to dispatch Make webhook event';
      console.error('Make webhook trigger error:', err);
    }
  } else {
    errorMessage = 'MAKE_WEBHOOK_URL environment variable is not configured.';
  }

  // Record log in database if available
  try {
    const supabaseServer = getSupabaseServerClient();
    if (supabaseServer) {
      await supabaseServer.from('automation_logs').insert({
        entity: payload.entity,
        action: payload.action,
        record_id: payload.record_id || null,
        payload: eventPayload,
        response_status: responseStatus,
        error_message: errorMessage,
      });
    }
  } catch (logErr) {
    console.warn('Failed to insert automation_log record:', logErr);
  }

  return {
    success: !errorMessage,
    request_id: requestId,
    response_status: responseStatus,
    error_message: errorMessage,
  };
}
