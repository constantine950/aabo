import { AbuseRule } from "../types";

// Abuse pattern definitions
//
// threshold     — number of occurrences that triggers the rule
// windowSeconds — time window to count occurrences within
// blockDuration — how long to block the entity if the rule fires
//
// All values are conservative defaults. Operators can tune these
// per deployment by modifying this file or exposing a config API.

export const rules: AbuseRule[] = [
  {
    name: "too_many_requests",
    description:
      "Client exceeds a very high request volume in a short window — likely a script or bot.",
    threshold: 200,
    windowSeconds: 60,
    blockDurationSeconds: 300,
  },
  {
    name: "repeated_auth_failures",
    description:
      "Client repeatedly sends invalid or missing API keys — likely credential stuffing.",
    threshold: 10,
    windowSeconds: 300,
    blockDurationSeconds: 600,
  },
  {
    name: "suspicious_route_scan",
    description:
      "Client hits many distinct routes rapidly — likely probing for endpoints.",
    threshold: 30,
    windowSeconds: 60,
    blockDurationSeconds: 300,
  },
  {
    name: "high_error_rate",
    description:
      "Client generates an unusually high proportion of 4xx/5xx responses.",
    threshold: 50,
    windowSeconds: 60,
    blockDurationSeconds: 180,
  },
  {
    name: "rapid_ip_rotation",
    description:
      "Same API key used from many distinct IPs in a short window — likely key sharing or abuse.",
    threshold: 10,
    windowSeconds: 300,
    blockDurationSeconds: 600,
  },
];

export const getRuleByName = (name: string): AbuseRule | undefined => {
  return rules.find((r) => r.name === name);
};
