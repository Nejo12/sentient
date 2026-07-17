import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'https://esm.sh/openai@4';

const BLOCKED = 'Something here needs another look.';

// Sentient rewrites tense, hostile messages by design — ordinary venting trips
// OpenAI's broader categories (harassment, hate, self-harm) constantly, so we
// only block on categories that indicate genuine danger, not heated language.
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

interface RewriteOption {
  label: string;
  tag: string;
  text: string;
  recommended: boolean;
}

interface RewriteResponse {
  perspective: string | null;
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

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(intent: Intent, understanding: Understanding | null): string {
  if (intent === 'missing') {
    return [
      'You help the user see what they might be missing in a tense message exchange.',
      'Return JSON: { perspective: string, options: [{ label, tag, text, recommended }] }',
      'with exactly 3 options. Mark exactly one option as recommended: true.',
      'Never mention AI. Warm en-GB tone.',
    ].join(' ');
  }

  return [
    `You rewrite replies so the user is understood as ${understanding}.`,
    'Return JSON: { perspective: null, options: [{ label, tag, text, recommended }] }',
    'with exactly 3 variant angles. Mark exactly one option as recommended: true.',
    'Never mention AI. Warm en-GB tone.',
  ].join(' ');
}

function isValidOption(value: unknown): value is RewriteOption {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const option = value as Record<string, unknown>;
  return (
    typeof option.label === 'string' &&
    typeof option.tag === 'string' &&
    typeof option.text === 'string' &&
    typeof option.recommended === 'boolean'
  );
}

function parseRewriteResponse(
  raw: unknown,
  intent: Intent,
): RewriteResponse | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const parsed = raw as Record<string, unknown>;
  if (!Array.isArray(parsed.options) || parsed.options.length !== 3) {
    return null;
  }

  if (!parsed.options.every(isValidOption)) {
    return null;
  }

  const perspective =
    intent === 'missing'
      ? typeof parsed.perspective === 'string'
        ? parsed.perspective
        : null
      : null;

  if (intent === 'missing' && !perspective) {
    return null;
  }

  return {
    perspective,
    options: parsed.options,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

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

  if (!capturedMessage?.trim()) {
    return jsonResponse({ error: 'capturedMessage is required' }, 400);
  }

  if (intent !== 'do' && intent !== 'missing') {
    return jsonResponse({ error: 'intent must be do or missing' }, 400);
  }

  if (intent === 'do') {
    if (
      !understanding ||
      !UNDERSTANDING_VALUES.includes(understanding)
    ) {
      return jsonResponse(
        { error: 'understanding is required for intent do' },
        400,
      );
    }
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  try {
    const openai = new OpenAI({ apiKey });

    const moderationInput = [capturedMessage, roughDraft ?? '']
      .filter(Boolean)
      .join('\n');

    const mod = await openai.moderations.create({ input: moderationInput });
    const categories = mod.results[0]?.categories as Record<string, boolean> | undefined;
    const severelyFlagged = SEVERE_MODERATION_CATEGORIES.some(
      (category) => categories?.[category],
    );
    if (severelyFlagged) {
      return jsonResponse({ blocked: true, message: BLOCKED }, 422);
    }

    const systemPrompt = buildSystemPrompt(intent, understanding);
    const userContent = [
      `Message from ${contactName ?? 'contact'}:`,
      capturedMessage,
      '',
      'Draft:',
      roughDraft?.trim() ? roughDraft : '(none)',
    ].join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return jsonResponse({ error: 'Empty model response' }, 502);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonResponse({ error: 'Invalid model response' }, 502);
    }

    const response = parseRewriteResponse(parsed, intent);
    if (!response) {
      return jsonResponse({ error: 'Model returned invalid rewrite options' }, 502);
    }

    return jsonResponse(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Rewrite request failed';
    console.error('rewrite function error:', message);
    return jsonResponse({ error: message }, 500);
  }
});
