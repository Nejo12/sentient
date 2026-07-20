export type Intent = 'do' | 'missing';

export type Understanding =
  | 'calm'
  | 'confident'
  | 'curious'
  | 'compassionate'
  | 'firm'
  | 'professional';

export type InterpretationConfidence = 'high' | 'medium' | 'low';

export interface MessageInterpretation {
  title: string;
  confidence: InterpretationConfidence;
  explanation: string;
}

export interface CommunicationAnalysis {
  possibleMeanings: MessageInterpretation[];
  whatWeCannotKnow: string[];
  watchOutFor: string[];
}

export interface RewriteOption {
  label: string;
  tag: string;
  text: string;
  recommended: boolean;
  rationale: string;
  understandingScore: number;
  risks: string[];
}
