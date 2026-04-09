import { AbuseRuleName } from "../types";

export interface AlertPayload {
  rule: AbuseRuleName;
  entity: string;
  entityType: "ip" | "key" | "user";
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
}

// Log alert to console
// webhook / Slack / email support.
export const sendAlert = (payload: AlertPayload): void => {
  console.warn(
    `[alert] ${payload.rule} triggered for ${payload.entityType}:${payload.entity} — blocked until ${payload.expiresAt.toISOString()}`,
  );
};
