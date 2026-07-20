# Calm Interaction

Sentient should reduce cognitive load rather than compete for attention. Interaction polish must therefore remain restrained, useful, and explainable.

## Principles

1. **The reply remains primary.** Motion and disclosure controls must never pull attention away from the recommended response.
2. **Movement explains change.** Expansion animation exists only to preserve spatial continuity when content appears or disappears.
3. **Progress copy describes real work.** Loading stages may describe broad product operations, but must not claim exact model internals, certainty, or fake percentages.
4. **Errors preserve context.** A failed request must leave the captured message intact and provide one clear recovery action.
5. **Repeated taps are harmless.** Regeneration is disabled while a request is active, and stale responses are ignored.
6. **Accessibility is structural.** Disclosure state, meaningful labels, live regions, minimum touch targets, and predictable focus order are part of the component contract.

## Disclosure behavior

- Duration: approximately 190 ms.
- Motion: opacity plus layout continuity.
- No spring, bounce, or elastic easing.
- Closed content is removed from the accessibility tree.
- Buttons expose `accessibilityState.expanded`.
- Minimum interactive height is 48 px.

## Loading behavior

The loading state presents one focused reply skeleton and three qualitative stages:

1. Reading tone
2. Considering ambiguity
3. Preparing the clearest reply

The sequence does not estimate completion time and must never display a percentage.

## Error recovery

A failed analysis presents:

- a human-readable summary
- the classified user-facing error message
- one `Try again` action

The original message, intent, contact context, and rough draft remain unchanged.

## Concurrency

Each regeneration receives a local sequence identifier. Results are applied only when they belong to the most recent active request. This protects the screen from stale responses after navigation or future request-cancellation work.

## Future work

- Respect the platform reduce-motion preference explicitly.
- Add haptic feedback only after device testing confirms it improves clarity.
- Measure whether staged loading reduces abandonment on slower requests.
- Apply the reusable disclosure component to other expandable product surfaces.