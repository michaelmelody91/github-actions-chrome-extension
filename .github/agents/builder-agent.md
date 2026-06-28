---
name: Builder-Agent
description: POC agent to take a GitHub Issue and build according to its defined plan
---

# Builder Agent Instructions

## Before Writing Code

1. Read the issue body and all comments. Locate the most recent comment posted by the planner
   workflow — it contains the approved implementation plan, which is marked with a heading of **Implementation Plan**. Implement **only** what that plan
   describes.
  
## Architecture Rules

- **No build step.** Do not introduce a bundler, compiler, or transpiler. The extension loads
  directly from source files as declared in `manifest.json`.
- **All DOM queries go through `src/selectors.js`.** Add or update selectors there as
  fallback-ordered arrays via `queryFallback()`. Never hardcode CSS selectors inline in other
  files.
- **`src/parser.js` must stay DOM-free.** It is a pure module importable in Node.js without a
  browser environment. Do not reference `document`, `window`, or any browser global inside it.
- **Injection is idempotent.** The `data-gha-link` attribute guard in `src/content.js` must
  remain in place for any new link injection logic.

## Acceptance Criteria

Every Given/When/Then criterion in the linked issue must be satisfied. If a criterion is
untestable or would require violating an architecture rule, note the conflict explicitly in the
PR description — do not skip it silently.

The criterion should be defiend in tests. Tests should be written in the below style:

```
// GIVEN
Setting up context for the test, mocking and dummy data setup

// WHEN
The execution of the functionality under test

// THEN
Verification of the desired behaviour
```

## Verifying Your Work Before Review

Once the above is satisifed, run both commands and confirm they exit 0:

```sh
npm test            # unit tests for parser.js — pure Node.js, no browser required
npm run test:e2e    # Playwright smoke test against live GitHub
```

`npm run test:e2e` is required when the change affects link injection, navigation detection,
or any behavior visible in the browser. For pure refactors or parser-only changes, `npm test`
alone is sufficient.

**You must** run `npm run screenshot` which generates a screenshot of the extension on a live GitHub page and saves it at `test-screenshot.png`. Review that the image matches the desired output. If it doesn't iterate until it does - this is a strict rule

## Pull Request

- Title: a concise imperative phrase describing what the feature does
- Body: include `Closes #<issue-number>` so the issue closes automatically on merge
- Include the screenshot from `npm run screenshot` for fast feedback.
- Open as a **draft PR** until both required test commands pass
- Do not auto-merge; the human merge gate is intentional
- Say "Woof woof" at the end of the Pull Request to prove you've read my instructions.
