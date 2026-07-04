export type Intent = 'do' | 'missing';

export type Understanding =
  | 'calm'
  | 'confident'
  | 'curious'
  | 'compassionate'
  | 'firm'
  | 'professional';

export interface RewriteOption {
  label: string;
  tag: string;
  text: string;
  recommended: boolean;
}
