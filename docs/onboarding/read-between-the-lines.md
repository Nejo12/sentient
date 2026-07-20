# Read Between the Lines onboarding

## Goal

A first-time user should understand Sentient's communication-intelligence value in under 45 seconds without being told about models or AI infrastructure.

## Flow

1. Experience ambiguity through the message `Okay.`
2. See that several interpretations may be plausible.
3. Learn Sentient's analysis sequence: original message, possible meanings, uncertainty, replies.
4. Change the desired outcome and see the reply adapt.
5. Understand the privacy boundary: only deliberately pasted or shared text is processed.
6. Continue into platform setup.

## Product principles

- Demonstrate value instead of listing features.
- Never claim certainty about another person's intent.
- Keep Skip available throughout.
- Separate product education from platform permission/setup steps.
- Do not mention GPT, LLMs, or being “powered by AI”.

## First-run behaviour

`app/index.tsx` checks the versioned onboarding-completion key before setup completion. A shared intent still takes priority and opens the core flow directly.

## Completion

Completing or skipping onboarding stores `sentient:onboarding-complete:v1` and routes to `/setup`.

## Validation

- Fresh install opens onboarding before setup.
- Continue on the first screen is disabled until an ambiguity choice is made.
- Skip marks onboarding complete and opens setup.
- Outcome selection changes the sample reply.
- Existing users with the onboarding key bypass the experience.
- Shared text still enters the choose flow without onboarding interruption.
