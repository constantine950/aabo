import { rules } from "./rules";
import { AbuseDetectionResult } from "../types";
import { increment, trackDistinct } from "../services/metricsService";

export interface DetectionContext {
  ip: string;
  apiKeyId?: string;
  route: string;
  statusCode: number;
  isAuthFailure?: boolean;
}

const getEntity = (ctx: DetectionContext): string => {
  return ctx.apiKeyId ?? ctx.ip;
};

export const detect = async (
  ctx: DetectionContext,
): Promise<AbuseDetectionResult> => {
  const entity = getEntity(ctx);

  for (const rule of rules) {
    let count = 0;

    switch (rule.name) {
      case "too_many_requests": {
        count = await increment(entity, "requests", rule.windowSeconds);
        break;
      }

      case "repeated_auth_failures": {
        if (!ctx.isAuthFailure) continue;
        count = await increment(entity, "auth_failures", rule.windowSeconds);
        break;
      }

      case "suspicious_route_scan": {
        count = await trackDistinct(
          entity,
          "routes",
          ctx.route,
          rule.windowSeconds,
        );
        break;
      }

      case "high_error_rate": {
        if (ctx.statusCode < 400) continue;
        count = await increment(entity, "errors", rule.windowSeconds);
        break;
      }

      case "rapid_ip_rotation": {
        if (!ctx.apiKeyId) continue;
        count = await trackDistinct(
          ctx.apiKeyId,
          "ips",
          ctx.ip,
          rule.windowSeconds,
        );
        break;
      }
    }

    if (count >= rule.threshold) {
      return {
        flagged: true,
        rule: rule.name,
        reason: rule.description,
      };
    }
  }

  return { flagged: false, rule: null, reason: null };
};
