# GitHub Actions Repo Links

A Chrome extension that adds a clickable link affordance to every `uses:` line in GitHub Actions workflow files, taking you directly to that action's repository.

## Install (development)

```sh
node scripts/generate-icons.js   # create placeholder icons
```

Open `chrome://extensions`, enable **Developer Mode**, click **Load unpacked**, and select this directory.

## Usage

Navigate to any workflow file on GitHub, e.g.:

```
https://github.com/owner/repo/blob/main/.github/workflows/ci.yml
```

Hover over a line containing `uses:` — a small arrow icon appears in the line-number column. Click it to navigate to that action's repository.

## How it works

1. When you land on a workflow file, the extension fetches the raw YAML from `raw.githubusercontent.com`.
2. Every `uses:` reference is resolved to a GitHub URL without touching the syntax-highlighted DOM (immune to GitHub UI changes).
3. A `MutationObserver` watches for new lines as you scroll (GitHub's React code viewer is virtualised) and attaches the affordance by stable line-number anchor.
4. A URL poller + `turbo:load` / `pjax:end` listeners re-initialise when you navigate between files without a full page reload.

## Development

```sh
npm test          # unit tests (parser.js — no browser needed)
npm run test:e2e  # Playwright smoke test against live GitHub
```

## Resilience against GitHub UI changes

All DOM selectors live in `src/selectors.js` as fallback-ordered arrays. If GitHub changes their markup, updating one line there is all that's needed. A scheduled GitHub Actions workflow (`smoke.yml`) runs the e2e test daily and alerts within 24 hours of any breakage.
