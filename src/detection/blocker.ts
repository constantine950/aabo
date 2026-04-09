import { block, isBlocked, unblock } from "../services/redisService";
import { BlockedEntityModel } from "../models/BlockedEntity";
import { AbuseRuleName } from "../types";
import { getRuleByName } from "./rules";
import { sendAlert } from "./alerts";

export type EntityType = "ip" | "key" | "user";

export const blockEntity = async (
  type: EntityType,
  value: string,
  ruleName: AbuseRuleName,
  blockedBy: "system" | "manual" = "system",
): Promise<void> => {
  const rule = getRuleByName(ruleName);
  const ttl = rule?.blockDurationSeconds ?? 300;
  const reason = rule?.description ?? ruleName;
  const expiresAt = new Date(Date.now() + ttl * 1000);

  await block(type, value, reason, ttl);

  await BlockedEntityModel.upsert({
    entity_type: type,
    entity_value: value,
    reason,
    blocked_by: blockedBy,
    expires_at: expiresAt,
  });

  sendAlert({
    rule: ruleName,
    entity: value,
    entityType: type,
    reason,
    blockedAt: new Date(),
    expiresAt,
  });
};

export const checkBlocked = async (
  type: EntityType,
  value: string,
): Promise<string | null> => {
  return isBlocked(type, value);
};

export const unblockEntity = async (
  type: EntityType,
  value: string,
): Promise<void> => {
  await unblock(type, value);
  await BlockedEntityModel.remove(type, value);
};
