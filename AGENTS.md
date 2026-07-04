# Sentient — Agent Instructions

## Project

Cross-app message improvement tool (React Native / Expo). Brand: **Sentient**.

## Required reading (in order)

1. `docs/superpowers/specs/2026-07-04-sentient-design.md` — approved product spec
2. `docs/superpowers/plans/2026-07-04-sentient-mvp.md` — implementation plan (when executing)
3. `docs/handoff/design_handoff_kindly/DESIGN_TOKENS.md` — visual tokens
4. `docs/handoff/design_handoff_kindly/README.md` — screen layout reference (adapt Kindly → Sentient)

## Rules

- **No improvisation.** If a requirement is unclear, ask the user. Do not guess copy, flows, or APIs.
- **Never ship OpenAI keys on device.** All LLM calls via Supabase Edge Functions.
- **Never label UI "AI" or "Generate".** Surfaces describe help or understanding.
- **Match design tokens exactly.** Oxblood primary only; DM Serif only on wordmark + Send-back preview.
- **TDD.** Write failing tests before implementation (see plan).
- **One screen at a time.** Compare against `docs/handoff/design_handoff_kindly/screens/*.png`.

## Superpowers workflow

When implementing:

1. Use `docs/superpowers/plans/2026-07-04-sentient-mvp.md` task-by-task
2. Sub-skill: **subagent-driven-development** (recommended) or **executing-plans**
3. Before claiming done: lint, test, build (see `package.json` scripts)

## Key decisions (do not revert without user approval)

- Intents: `What can I do?` / `What am I missing?`
- Understanding (do-path only): Calm, Confident, Curious, Compassionate, Firm, Professional
- 3 options per Compare; 5 free rewrites/day; moderation API + prompts
- iOS keyboard deferred v1.1
