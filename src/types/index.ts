import { Request } from "express";

export interface ApiKey {
  id: string;
  key_hash: string;
  name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKey;
}

//Abuse detection
export type AbuseRuleName =
  | "too_many_requests"
  | "repeated_auth_failures"
  | "suspicious_route_scan"
  | "high_error_rate"
  | "rapid_ip_rotation";

export interface AbuseRule {
  name: AbuseRuleName;
  description: string;
  threshold: number;
  windowSeconds: number;
  blockDurationSeconds: number;
}

export interface AbuseDetectionResult {
  flagged: boolean;
  rule: AbuseRuleName | null;
  reason: string | null;
}
