import { create } from 'zustand';

import type {
  Intent,
  MessageInterpretation,
  RewriteOption,
  Understanding,
} from '../types/rewrite';

interface SessionState {
  capturedMessage: string;
  contactName: string;
  sourceApp: string;
  roughDraft: string;
  intent: Intent | null;
  understanding: Understanding | null;
  perspective: string | null;
  interpretations: MessageInterpretation[];
  results: RewriteOption[];
  chosenReply: string;
  loading: boolean;
  error: string | null;
  showUnderstandingGrid: boolean;
}

interface SessionActions {
  setCapturedContext: (
    message: string,
    contactName: string,
    sourceApp: string,
  ) => void;
  setCapturedMessage: (message: string) => void;
  setRoughDraft: (text: string) => void;
  setIntent: (intent: Intent) => void;
  setUnderstanding: (understanding: Understanding) => void;
  setResults: (
    results: RewriteOption[],
    context?: MessageInterpretation[] | string,
  ) => void;
  setChosenReply: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  capturedMessage: '',
  contactName: '',
  sourceApp: '',
  roughDraft: '',
  intent: null,
  understanding: null,
  perspective: null,
  interpretations: [],
  results: [],
  chosenReply: '',
  loading: false,
  error: null,
  showUnderstandingGrid: false,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,
  setCapturedContext: (message, contactName, sourceApp) =>
    set({ capturedMessage: message, contactName, sourceApp }),
  setCapturedMessage: (message) => set({ capturedMessage: message }),
  setRoughDraft: (text) => set({ roughDraft: text }),
  setIntent: (intent) =>
    set({
      intent,
      showUnderstandingGrid: intent === 'do',
      ...(intent === 'missing' ? { understanding: null } : {}),
    }),
  setUnderstanding: (understanding) => set({ understanding }),
  setResults: (results, context) =>
    set({
      results,
      perspective: typeof context === 'string' ? context : null,
      interpretations: Array.isArray(context) ? context : [],
    }),
  setChosenReply: (text) => set({ chosenReply: text }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
