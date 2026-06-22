# CLAUDE.md / AGENTS.md

This file provides guidance to AI coding agents when working with this repository.

## Purpose

This is a Chrome extension that improves the GitHub workflow-file reading experience. When viewing a `.github/workflows/*.yml` file on GitHub, every `uses:` line gets a small arrow-icon link injected into the line-number column. Clicking it navigates directly to that action's source repository (or the exact tree for SHA-pinned references).

The core problem it solves: GitHub does not make `uses:` references clickable, so developers must manually copy the action name and search for it. The extension eliminates that friction.

Design goals baked into the implementation:
- **Immune to GitHub UI changes** — the parser works from raw YAML fetched independently of the rendered page, so GitHub's syntax-highlighting markup is irrelevant.
- **Resilient DOM queries** — all selectors live in `src/selectors.js` as fallback-ordered arrays; updating one line there adapts to a GitHub markup change.
- **24-hour breakage detection** — a scheduled GitHub Actions workflow (`smoke.yml`) runs the e2e test daily against live GitHub.

## Commands

```sh
npm test            # unit tests for parser.js — pure Node.js, no browser
npm run test:e2e    # Playwright smoke test against live GitHub (requires Chromium)
npm run icons       # regenerate placeholder icons (needed once after cloning)
```

The e2e test loads the extension into a headless Chromium instance and navigates to a real GitHub workflow page. Set `PWHEADLESS=false` to watch it run locally. On Linux CI, wrap with `xvfb-run --auto-servernum`.

There is no test runner framework — `test/parser.test.js` uses Node's built-in `assert` and exits non-zero on failure. Run a single logical test by commenting out the others.

## Architecture

No build step. The three content scripts are loaded in declaration order by `manifest.json`:

1. **`src/selectors.js`** — Defines `SELECTORS` (fallback-ordered CSS selector arrays) and `queryFallback()`. All DOM queries go through here.

2. **`src/parser.js`** — Pure module (no DOM). Parses raw YAML text and resolves `uses:` references to GitHub URLs. Dual-exported via `module.exports` for Node.js unit tests.

3. **`src/content.js`** — Orchestrates everything. On initialization it fetches raw YAML from `raw.githubusercontent.com`, builds a `lineNumber → url` map, injects `<a class="gha-action-link">` elements into line-number cells, and starts a `MutationObserver` to re-inject as GitHub's virtualised React viewer mounts/unmounts lines during scrolling. Re-initializes on `turbo:load`, `pjax:end`, and a 1-second URL poll for SPA navigation.

The extension activates only on `https://github.com/*/*/blob/*` and self-filters to workflow paths in `parseWorkflowUrl()`. Injection is idempotent via a `data-gha-link` attribute on each processed cell.
