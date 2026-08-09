export const ALLOWED_ENTITIES = [
  'appointment',
  'service',
  'barber',
  'customer',
  'message',
  'contact_message',
  'notification',
  'availability',
  'settings',
] as const;

export const ALLOWED_ACTIONS = [
  'create',
  'get',
  'list',
  'update',
  'delete',
  'confirm',
  'cancel',
  'complete',
  'send',
] as const;

export type MakeEntity = typeof ALLOWED_ENTITIES[number];
export type MakeAction = typeof ALLOWED_ACTIONS[number];

export interface MakeEventPayload {
  entity: MakeEntity;
  action: MakeAction;
  record_id?: string | null;
  actor?: {
    id: string;
    role: string;
  };
  data?: Record<string, unknown>;
  request_id: string;
}

export function getMakeWebhookConfig() {
  const webhookUrl =
    process.env.MAKE_WEBHOOK_URL ||
    (typeof window !== 'undefined' ? (window as any).__MAKE_WEBHOOK_URL__ : '') ||
    '';
  const webhookSecret = process.env.MAKE_WEBHOOK_SECRET || '';

  return {
    webhookUrl,
    webhookSecret,
  };
}
