import type { Intent, Understanding } from './rewrite';

export interface RewriteRecord {
  id: string;
  contactName: string;
  sourceApp: string;
  intent: Intent;
  understanding: Understanding | null;
  snippet: string;
  fullText: string;
  createdAt: string;
}

export interface SaveRewriteInput {
  contactName: string;
  sourceApp: string;
  intent: Intent;
  understanding: Understanding | null;
  fullText: string;
}
