import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'https://esm.sh/openai@4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BLOCKED = 'Something here needs another look.';
const HARD_DAILY_SAFETY_LIMIT = 100;
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
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type Intent = 'do' | 'missing';
type Confidence = 'high' | 'medium' | 'low';
type Understanding =
  | 'calm'
  | 'confident'
  | 'curious'
  | 'compassionate'
  | 'firm'
  | 'professional';

interface RewriteRequest {
  capturedMessage?: string;
  roughDraft?: string | null;
  intent?: Intent;
  understanding?: Understanding | null;
  contactName?: string | null;
}

interface MessageInterpretation {
  title: string;
  confidence: Confidence;
  explanation: string;
}

interface RewriteOption {
  label: string;
  tag: string;
  text: string;
  recommended: boolean;
  rationale: string;
  understandingScore: number;
  risks: string[];
}

interface RewriteResponse {
  interpretations: MessageInterpretation[];
  options: RewriteOption[];
}

const UNDERSTANDING_VALUES: Understanding[] = [
  'calm',
  'confident',
  'curious',
  'compassionate',
  'firm',
  'professional',
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(intent: Intent, understanding: Understanding | null): string {
  const outcome =
    intent === 'missing'
      ? 'help the user respond while accounting for what they may be overlooking'
      : `help the user be understood as ${understanding}`;

  return [
    'You are Sentient, a communication-intelligence assistant.',
    'Analyse the message cautiously before drafting a reply.',
    'Never claim to know the sender’s internal state. Use may, might and could.',
    `The user wants to ${outcome}.`,
    'Return strict JSON with exactly this shape:',
    '{ interpretations: [{ title, confidence, explanation }], options: [{ label, tag, text, recommended, rationale, understandingScore, risks }] }.',
    'Return exactly 3 interpretations and exactly 3 options.',
    'Interpretation confidence must be high, medium or low and means textual plausibility, not certainty about a person.',
    'Mark exactly one option recommended true.',
    'understandingScore must be an integer from 0 to 100 based on clarity, tone, specificity and assumption risk.',
    'risks must be an array with zero to two short communication trade-offs.',
    'rationale must briefly explain why the reply may work.',
    'Never diagnose, moralise, mention AI or fabricate context. Use concise en-GB language.',
  ].join(' ');
}

function isInterpretation(value: unknown): value is MessageInterpretation {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title === 'string' &&
    (item.confidence === 'high' || item.confidence === 'medium' || item.confidence === 'low') &&
    typeof item.explanation === 'string'
  );
}

function isOption(value: unknown): value is RewriteOption {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.label === 'string' &&
    typeof item.tag === 'string' &&
    typeof item.text === 'string' &&
    typeof item.recommended === 'boolean' &&
    typeof item.rationale === 'string' &&
    typeof item.understandingScore === 'number' &&
    Number.isInteger(item.understandingScore) &&
    item.understandingScore >= 0 &&
    item.understandingScore <= 100 &&
    Array.isArray(item.risks) &&
    item.risks.every((risk) => typeof risk === 'string')
  );
}

function parseResponse(raw: unknown): RewriteResponse | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const parsed = raw as Record<string, unknown>;
  if (
    !Array.isArray(parsed.interpretations) ||
    parsed.interpretations.length !== 3 ||
    !parsed.interpretations.every(isInterpretation) ||
    !Array.isArray(parsed.options) ||
    parsed.options.length !== 3 ||
    !parsed.options.every(isOption)
  ) {
    return null;
  }
  if (parsed.options.filter((option) => option.recommended).length !== 1) return null;
  return {
    interpretations: parsed.interpretations,
    options: parsed.options,
  };
}

async function authenticateRequest(req: Request): Promise<string | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const authorization = req.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !authorization?.startsWith('Bearer ')) return null;

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : data.user.id;
}

async function consumeSafetyQuota(userId: string): Promise<'allowed' | 'blocked' | 'error'> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return 'error';

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const userId = await authenticateRequest(req);
  if (!userId) return jsonResponse({ error: 'Authentication required' }, 401);

  let body: RewriteRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const {
    capturedMessage,
    roughDraft = null,
    intent,
    understanding = null,
    contactName = null,
  } = body;

  if (!capturedMessage?.trim()) return jsonResponse({ error: 'capturedMessage is required' }, 400);
  if (intent !== 'do' && intent !== 'missing') return jsonResponse({ error: 'intent must be do or missing' }, 400);
  if (intent === 'do' && (!understanding || !UNDERSTANDING_VALUES.includes(understanding))) {
    return jsonResponse({ error: 'understanding is required for intent do' }, 400);
  }

  const quota = await consumeSafetyQuota(userId);
  if (quota === 'blocked') return jsonResponse({ error: 'Daily safety limit reached' }, 429);
  if (quota === 'error') return jsonResponse({ error: 'Usage verification unavailable' }, 503);

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return jsonResponse({ error: 'Server configuration error' }, 500);

  try {
    const openai = new OpenAI({ apiKey });
    const moderationInput = [capturedMessage, roughDraft ?? ''].filter(Boolean).join('\n');
    const mod = await openai.moderations.create({ input: moderationInput });
    const categories = mod.results[0]?.categories as Record<string, boolean> | undefined;
    if (SEVERE_MODERATION_CATEGORIES.some((category) => categories?.[category])) {
      return jsonResponse({ blocked: true, message: BLOCKED }, 422);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(intent, understanding) },
        {
          role: 'user',
          content: [
            `Message from ${contactName ?? 'contact'}:`,
            capturedMessage,
            '',
            'User draft:',
            roughDraft?.trim() ? roughDraft : '(none)',
          ].join('\n'),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return jsonResponse({ error: 'Empty model response' }, 502);

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonResponse({ error: 'Invalid model response' }, 502);
    }

    const response = parseResponse(parsed);
    return response
      ? jsonResponse(response)
      : jsonResponse({ error: 'Model returned invalid communication analysis' }, 502);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rewrite request failed';
    console.error('rewrite function error:', message);
    return jsonResponse({ error: 'Rewrite request failed' }, 500);
  }
});
