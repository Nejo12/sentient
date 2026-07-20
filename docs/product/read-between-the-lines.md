# Read Between the Lines — milestone contract

## User-visible capability

Sentient helps a user consider plausible meanings behind a message before choosing a reply.

The product must:

1. present multiple possible interpretations rather than claim certainty;
2. express confidence as a qualitative signal, not as fact;
3. explain why each reply may work;
4. surface communication risks and trade-offs;
5. provide a simple likelihood-of-being-understood score for each generated reply.

## Trust rules

- Use language such as `may`, `might`, and `could`.
- Never diagnose the sender or claim knowledge of their internal state.
- Never describe confidence as certainty about another person's intent.
- Scores are communication heuristics, not objective measurements.
- Keep explanations concise and actionable.

## Response contract

```ts
{
  interpretations: [
    {
      title: string;
      confidence: 'high' | 'medium' | 'low';
      explanation: string;
    }
  ];
  options: [
    {
      label: string;
      tag: string;
      text: string;
      recommended: boolean;
      rationale: string;
      understandingScore: number;
      risks: string[];
    }
  ];
}
```

The API returns exactly three interpretations and three reply options.

## Initial release scope

The existing **What am I missing?** route is the first entry point for the capability. Interpretations appear before the reply options, while every option includes rationale, trade-offs and an understanding score. A later iteration can separate interpretation and outcome selection into dedicated screens after device and user validation.
