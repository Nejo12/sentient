import type { Intent, Understanding } from '../types/rewrite';

export const UNDERSTANDING_OPTIONS: { key: Understanding; label: string }[] = [
  { key: 'calm', label: 'Calm' },
  { key: 'confident', label: 'Confident' },
  { key: 'curious', label: 'Curious' },
  { key: 'compassionate', label: 'Compassionate' },
  { key: 'firm', label: 'Firm' },
  { key: 'professional', label: 'Professional' },
];

export function requiresUnderstanding(intent: Intent): boolean {
  return intent === 'do';
}
