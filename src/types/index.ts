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
