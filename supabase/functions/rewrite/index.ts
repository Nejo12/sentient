import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'https://esm.sh/openai@4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BLOCKED = 'Something here needs another look.';
const HARD_DAILY_SAFETY_LIMIT = 100;
const FUNCTION_VERSION = 'rewrite-v2.3';
const PROMPT_VERSION = 'communication-intelligence-v1';
const CONTRACT_VERSION = 'analysis-v2';
const MODEL = 'gpt-4o-mini';
const SEVERE_MODERATION_CATEGORIES = [
  'sexual/minors',
  'self-harm/intent',
  'self-harm/instructions',
  'violence/graphic',
  'harassment/threatening',
  'hate/threatening',
] as const;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Intent = 'do' | 'missing';
type Understanding = 'calm' | 'confident' | 'curious' | 'compassionate' | 'firm' | 'professional';
type Confidence = 'high' | 'medium' | 'low';

type AuthenticatedUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
};

interface RewriteRequest {
  mode?: 'diagnostics';
  capturedMessage?: string;
  roughDraft?: string | null;
  intent?: Intent;
  understanding?: Understanding | null;
  contactName?: string | null;
}

interface Meaning { title: string; confidence: Confidence; explanation: string; }
interface CommunicationAnalysis { possibleMeanings: Meaning[]; whatWeCannotKnow: string[]; watchOutFor: string[]; }
interface ResponseOption {
  label: string;
  tag: string;
  text: string;
  recommended: boolean;
  rationale: string;
  understandingScore: number;
  risks: string[];
}
interface RewriteResponse { analysis: CommunicationAnalysis; responses: ResponseOption[]; }

const UNDERSTANDING_VALUES: Understanding[] = ['calm', 'confident', 'curious', 'compassionate', 'firm', 'professional'];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function buildSystemPrompt(intent: Intent, understanding: Understanding | null): string {
  const goal = intent === 'missing'
    ? 'Help the user pause, interpret cautiously, and reply without escalating.'
    : `Help the user reply so they are likely to be understood as ${understanding}.`;

  return [
    'You are Sentient, a communication-intelligence system. Optimise for successful mutual understanding, not merely better wording.',
    goal,
    'Return only JSON with exactly this top-level shape:',
    '{"analysis":{"possibleMeanings":[{"title":string,"confidence":"high"|"medium"|"low","explanation":string}],"whatWeCannotKnow":string[],"watchOutFor":string[]},"responses":[{"label":string,"tag":string,"text":string,"recommended":boolean,"rationale":string,"understandingScore":number,"risks":string[]}]}',
    'Provide exactly 3 possibleMeanings and exactly 3 responses. Mark exactly one response recommended.',
    'Possible meanings are plausible readings, never facts about the sender. Confidence means textual support, not certainty about a person.',
    'whatWeCannotKnow identifies missing context or internal states that cannot be inferred from the message alone.',
    'watchOutFor contains concise communication hazards relevant before replying.',
    'understandingScore is an estimate from 0 to 100 of clarity and likely interpretability, not an objective measurement.',
    'Do not diagnose, mind-read, fabricate relationship history, or claim hidden motives. Use cautious language such as may, might, or could.',
    'Keep rationales and risks concise. Use natural en-GB English. Never mention AI.',
  ].join(' ');
}

function isMeaning(value: unknown): value is Meaning {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.title === 'string' &&
    (item.confidence === 'high' || item.confidence === 'medium' || item.confidence === 'low') &&
    typeof item.explanation === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isResponseOption(value: unknown): value is ResponseOption {
  if (typeof value !== 'object' || value === null) return false;
  const option = value as Record<string, unknown>;
  return typeof option.label === 'string' && typeof option.tag === 'string' &&
    typeof option.text === 'string' && typeof option.recommended === 'boolean' &&
    typeof option.rationale === 'string' && typeof option.understandingScore === 'number' &&
    option.understandingScore >= 0 && option.understandingScore <= 100 && isStringArray(option.risks);
}

function parseRewriteResponse(raw: unknown): RewriteResponse | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const parsed = raw as Record<string, unknown>;
  const analysis = parsed.analysis as Record<string, unknown> | undefined;
  if (!analysis || typeof analysis !== 'object') return null;
  if (!Array.isArray(analysis.possibleMeanings) || analysis.possibleMeanings.length !== 3) return null;
  if (!analysis.possibleMeanings.every(isMeaning)) return null;
  if (!isStringArray(analysis.whatWeCannotKnow) || !isStringArray(analysis.watchOutFor)) return null;
  if (!Array.isArray(parsed.responses) || parsed.responses.length !== 3) return null;
  if (!parsed.responses.every(isResponseOption)) return null;
  if (parsed.responses.filter((option) => option.recommended).length !== 1) return null;
  return {
    analysis: {
      possibleMeanings: analysis.possibleMeanings,
      whatWeCannotKnow: analysis.whatWeCannotKnow,
      watchOutFor: analysis.watchOutFor,
    },
    responses: parsed.responses,
  };
}

async function authenticateRequest(req: Request): Promise<AuthenticatedUser | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const authorization = req.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !authorization?.startsWith('Bearer ')) return null;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email?.trim().toLowerCase() ?? null,
    isAnonymous: data.user.is_anonymous === true,
  };
}

function isDiagnosticsAdmin(user: AuthenticatedUser): boolean {
  if (user.isAnonymous || !user.email) return false;
  const configured = Deno.env.get('SENTIENT_ADMIN_EMAILS') ?? '';
  const allowedEmails = configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return allowedEmails.includes(user.email);
}

async function consumeSafetyQuota(userId: string): Promise<'allowed' | 'blocked' | 'error'> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return 'error';
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc('consume_rewrite_safety_quota', {
    p_user_id: userId,
    p_daily_limit: HARD_DAILY_SAFETY_LIMIT,
  });
  if (error) {
    console.error('rewrite quota error:', error.message);
    return 'error';
  }
  const result = Array.isArray(data) ? data[0] : data;
  return result?.allowed === true ? 'allowed' : 'blocked';
}

function classifyOpenAIError(error: unknown): { code: string; state: string; detail: string; status: number } {
  const value = error as { status?: number; code?: string; type?: string; message?: string };
  const message = value?.message ?? 'OpenAI request failed';
  if (value?.status === 401) return { code: 'OPENAI_INVALID_KEY', state: 'invalid_key', detail: 'The OpenAI API key was rejected.', status: 502 };
  if (value?.status === 429) {
    const billing = /quota|billing|credit|insufficient/i.test(message);
    return billing
      ? { code: 'OPENAI_BILLING_LIMIT', state: 'billing_limit', detail: 'OpenAI billing credit or project budget is exhausted.', status: 503 }
      : { code: 'OPENAI_RATE_LIMIT', state: 'rate_limited', detail: 'OpenAI is temporarily rate limiting requests.', status: 503 };
  }
  if (value?.status === 408 || value?.status === 504) return { code: 'OPENAI_TIMEOUT', state: 'timeout', detail: 'OpenAI timed out.', status: 504 };
  return { code: 'OPENAI_UNAVAILABLE', state: 'error', detail: message, status: 502 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const user = await authenticateRequest(req);
  if (!user) return jsonResponse({ code: 'SUPABASE_AUTH_FAILED', error: 'Authentication required' }, 401);

  let body: RewriteRequest;
  try { body = await req.json(); } catch { return jsonResponse({ code: 'INVALID_REQUEST', error: 'Invalid JSON body' }, 400); }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return jsonResponse({ code: 'SERVER_CONFIGURATION_ERROR', error: 'OpenAI API key is not configured' }, 500);

  if (body.mode === 'diagnostics') {
    if (!isDiagnosticsAdmin(user)) {
      return jsonResponse({
        code: 'DIAGNOSTICS_ADMIN_REQUIRED',
        error: 'Diagnostics require an authorised signed-in administrator account.',
      }, 403);
    }

    const started = Date.now();
    try {
      const openai = new OpenAI({ apiKey });
      await openai.models.retrieve(MODEL);
      return jsonResponse({
        ok: true,
        version: FUNCTION_VERSION,
        promptVersion: PROMPT_VERSION,
        contractVersion: CONTRACT_VERSION,
        model: MODEL,
        latencyMs: Date.now() - started,
        openai: { state: 'ok', detail: `Connected · ${MODEL}` },
      });
    } catch (error) {
      const classified = classifyOpenAIError(error);
      console.error('diagnostics openai error:', classified.code);
      return jsonResponse({
        ok: false,
        version: FUNCTION_VERSION,
        promptVersion: PROMPT_VERSION,
        contractVersion: CONTRACT_VERSION,
        model: MODEL,
        latencyMs: Date.now() - started,
        code: classified.code,
        error: classified.detail,
        openai: { state: classified.state, detail: classified.detail },
      }, classified.status);
    }
  }

  const { capturedMessage, roughDraft = null, intent, understanding = null, contactName = null } = body;
  if (!capturedMessage?.trim()) return jsonResponse({ code: 'INVALID_REQUEST', error: 'capturedMessage is required' }, 400);
  if (intent !== 'do' && intent !== 'missing') return jsonResponse({ code: 'INVALID_REQUEST', error: 'intent must be do or missing' }, 400);
  if (intent === 'do' && (!understanding || !UNDERSTANDING_VALUES.includes(understanding))) {
    return jsonResponse({ code: 'INVALID_REQUEST', error: 'understanding is required for intent do' }, 400);
  }

  const quota = await consumeSafetyQuota(user.id);
  if (quota === 'blocked') return jsonResponse({ code: 'SAFETY_QUOTA_EXCEEDED', error: 'Daily safety limit reached' }, 429);
  if (quota === 'error') return jsonResponse({ code: 'USAGE_VERIFICATION_UNAVAILABLE', error: 'Usage verification unavailable' }, 503);

  try {
    const openai = new OpenAI({ apiKey });
    const moderationInput = [capturedMessage, roughDraft ?? ''].filter(Boolean).join('\n');
    const mod = await openai.moderations.create({ input: moderationInput });
    const categories = mod.results[0]?.categories as Record<string, boolean> | undefined;
    if (SEVERE_MODERATION_CATEGORIES.some((category) => categories?.[category])) {
      return jsonResponse({ code: 'CONTENT_REQUIRES_REVIEW', blocked: true, message: BLOCKED }, 422);
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(intent, understanding) },
        { role: 'user', content: [`Message from ${contactName ?? 'contact'}:`, capturedMessage, '', 'User draft:', roughDraft?.trim() ? roughDraft : '(none)'].join('\n') },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return jsonResponse({ code: 'EMPTY_MODEL_RESPONSE', error: 'Empty model response' }, 502);
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { return jsonResponse({ code: 'INVALID_MODEL_RESPONSE', error: 'Invalid model response' }, 502); }
    const response = parseRewriteResponse(parsed);
    if (!response) return jsonResponse({ code: 'INVALID_MODEL_RESPONSE', error: 'Model returned invalid communication analysis' }, 502);
    return jsonResponse(response);
  } catch (error) {
    const classified = classifyOpenAIError(error);
    console.error('rewrite function error:', classified.code);
    return jsonResponse({ code: classified.code, error: classified.detail }, classified.status);
  }
});