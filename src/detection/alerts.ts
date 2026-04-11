import { AbuseRuleName } from "../types";

export interface AlertPayload {
  rule: AbuseRuleName;
  entity: string;
  entityType: "ip" | "key" | "user";
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
}

// Console alert

const logAlert = (payload: AlertPayload): void => {
  console.warn(
    `[alert] ${payload.rule} — ${payload.entityType}:${payload.entity} blocked until ${payload.expiresAt.toISOString()}`,
  );
};

// Webhook alert

const sendWebhook = async (payload: AlertPayload): Promise<void> => {
  const url = process.env.ALERT_WEBHOOK_URL;
  console.log("[alert] webhook url:", url);
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "abuse_detected",
        rule: payload.rule,
        entity: payload.entity,
        entity_type: payload.entityType,
        reason: payload.reason,
        blocked_at: payload.blockedAt.toISOString(),
        expires_at: payload.expiresAt.toISOString(),
      }),
    });
  } catch (err) {
    console.error("[alert] webhook delivery failed:", err);
  }
};

// Main entry point

export const sendAlert = (payload: AlertPayload): void => {
  logAlert(payload);

  // Fire webhook async — never awaited so it never blocks the request
  sendWebhook(payload).catch((err) => {
    console.error("[alert] unexpected webhook error:", err);
  });
};
