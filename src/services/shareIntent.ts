type ShareIntentParamValue = string | string[] | undefined;

export interface ParsedShareIntent {
  message: string;
  sourceApp: string;
}

interface NativeShareIntentShape {
  text?: string | null;
  webUrl?: string | null;
  meta?: { title?: string | null } | null;
}

interface ParseShareIntentInput {
  url?: string | null;
  params?: Record<string, ShareIntentParamValue>;
}

const MESSAGE_KEYS = ['message', 'text', 'sharedText', 'content', 'url'] as const;
const SOURCE_APP_KEYS = ['sourceApp', 'app', 'source', 'sourceApplication'] as const;

export function isShareExtensionUrl(url: string | null | undefined): boolean {
  return Boolean(url?.includes('dataUrl=') && url.includes('ShareKey'));
}

export function parseNativeShareIntent(
  shareIntent: NativeShareIntentShape | null | undefined,
): ParsedShareIntent | null {
  if (!shareIntent) {
    return null;
  }

  const message = shareIntent.text?.trim() || shareIntent.webUrl?.trim();
  if (!message) {
    return null;
  }

  return {
    message,
    sourceApp: shareIntent.meta?.title?.trim() ?? '',
  };
}

function getSingleParamValue(value: ShareIntentParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function normaliseValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getPreferredValue(
  params: Record<string, ShareIntentParamValue>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = normaliseValue(getSingleParamValue(params[key]));
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseUrlParams(url: string | null | undefined): Record<string, ShareIntentParamValue> {
  if (!url) {
    return {};
  }

  try {
    const parsedUrl = new URL(url);
    const values: Record<string, ShareIntentParamValue> = {};

    parsedUrl.searchParams.forEach((value, key) => {
      values[key] = value;
    });

    return values;
  } catch {
    return {};
  }
}

export function parseShareIntent(input: ParseShareIntentInput): ParsedShareIntent | null {
  const urlParams = parseUrlParams(input.url);
  const mergedParams = { ...urlParams, ...input.params };

  const message = getPreferredValue(mergedParams, MESSAGE_KEYS);
  if (!message) {
    return null;
  }

  const sourceApp = getPreferredValue(mergedParams, SOURCE_APP_KEYS) ?? '';

  return {
    message,
    sourceApp,
  };
}
