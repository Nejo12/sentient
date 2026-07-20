# Adaptive Intelligence

## Product goal

Sentient should help immediately without forcing every user to read a full communication analysis.

The default experience is therefore fast and action-oriented. Deeper interpretation is available through progressive disclosure.

## Product principle

> Respect the user's cognitive budget.

Information should appear only when it is useful to the decision the user is making now.

## Disclosure hierarchy

### Level 1 — Act

Shown by default:

- one recommended reply
- copy and use actions
- one concise misunderstanding caution when ambiguity or risk is present
- optional `Why this reply?` disclosure

A user who needs a quick response should be able to stop here.

### Level 2 — Understand

Opened through `Understand more`:

- the most relevant possible meanings
- interpretation confidence labels
- a concise uncertainty disclaimer

This level supports users who want context without a long report.

### Level 3 — Reflect

Opened through `Tell me more`:

- all available meanings
- what cannot be known from the text alone
- communication risks and escalation hazards

This level is intended for ambiguous, emotional, or high-stakes exchanges.

### Alternatives

Alternative replies are independent from analysis depth. They remain collapsed until the user explicitly asks to see them.

This prevents multiple full reply cards from competing with the recommended action.

## Confidence and uncertainty

Sentient must not present an understanding score as certainty about another person's intent.

Current rules:

- `understandingScore` describes the estimated likelihood that a reply will communicate clearly.
- interpretation confidence labels apply only to possible readings of the incoming message.
- a misunderstanding caution appears when multiple plausible meanings or explicit communication risks exist.
- no percentage should claim to measure what the sender truly meant.

## Loading

Loading copy should describe useful work without pretending to expose precise internal pipeline progress.

Current language:

- `Understanding the message…`
- `Considering context, ambiguity, and the clearest safe reply.`

## Accessibility

- every disclosure control uses the button role
- disclosure controls expose expanded or collapsed state
- the fast path does not depend on animation
- all content remains available without gestures
- copy and use actions remain visible before any expansion

## Success criteria

1. A user can copy the recommended reply without expanding anything.
2. The recommended reply is visually dominant.
3. Analysis is hidden by default but reachable in one tap.
4. uncertainty and risk require a second deliberate disclosure.
5. alternative replies do not appear until requested.
6. legacy perspective responses remain supported.
7. no UI language implies certainty about another person's private intent.
