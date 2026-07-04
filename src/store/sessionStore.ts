import { create } from 'zustand';

import type { Intent, RewriteOption, Understanding } from '../types/rewrite';

interface SessionState {
  capturedMessage: string;
  contactName: string;
  sourceApp: string;
  roughDraft: string;
  intent: Intent | null;
  understanding: Understanding | null;
  perspective: string | null;
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
  setRoughDraft: (text: string) => void;
  setIntent: (intent: Intent) => void;
  setUnderstanding: (understanding: Understanding) => void;
  setResults: (results: RewriteOption[], perspective?: string) => void;
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
  setRoughDraft: (text) => set({ roughDraft: text }),
  setIntent: (intent) =>
    set({
      intent,
      showUnderstandingGrid: intent === 'do',
      ...(intent === 'missing' ? { understanding: null } : {}),
    }),
  setUnderstanding: (understanding) => set({ understanding }),
  setResults: (results, perspective) =>
    set({
      results,
      ...(perspective !== undefined ? { perspective } : {}),
    }),
  setChosenReply: (text) => set({ chosenReply: text }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
