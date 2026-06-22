// Extracts `uses:` action references from raw YAML text and resolves them to GitHub URLs.
// Pure module — no DOM access. Unit-testable in Node.js.

function extractUsesRefs(yamlText) {
  const results = [];
  const pattern = /^\s*(?:-\s+)?uses:\s*['"]?([^'"\s#]+)/;
  yamlText.split('\n').forEach((line, index) => {
    if (line.trimStart().startsWith('#')) return;
    const match = line.match(pattern);
    if (match) results.push({ lineNumber: index + 1, actionRef: match[1] });
  });
  return results;
}

function resolveActionUrl(actionRef, { owner, repo, ref }) {
  if (!actionRef) return null;

  // Skip docker:// and other protocol-prefixed values
  if (/^[a-z][a-z0-9+\-.]*:\/\//.test(actionRef)) return null;

  // Local action: ./.github/actions/my-action
  if (actionRef.startsWith('./')) {
    return `https://github.com/${owner}/${repo}/tree/${ref}/${actionRef.slice(2)}`;
  }

  // Standard: owner/repo@ref or owner/repo/subdir@ref
  const atIdx = actionRef.lastIndexOf('@');
  if (atIdx === -1) return null;

  const path = actionRef.slice(0, atIdx);
  const actionRef_ = actionRef.slice(atIdx + 1);
  const pathParts = path.split('/');
  if (pathParts.length < 2) return null;

  const actionOwner = pathParts[0];
  const actionRepo = pathParts[1];
  const subdir = pathParts.slice(2).join('/');
  const base = `https://github.com/${actionOwner}/${actionRepo}`;

  if (subdir) return `${base}/tree/${actionRef_}/${subdir}`;

  // SHA-pinned (7–40 lowercase hex chars) → link to that exact tree
  if (/^[0-9a-f]{7,40}$/.test(actionRef_)) return `${base}/tree/${actionRef_}`;

  // Branch/tag → repo root
  return base;
}

function parseWorkflowActions(yamlText, { owner, repo, ref }) {
  return extractUsesRefs(yamlText)
    .map(({ lineNumber, actionRef }) => ({
      lineNumber,
      actionRef,
      url: resolveActionUrl(actionRef, { owner, repo, ref }),
    }))
    .filter(item => item.url !== null);
}

if (typeof module !== 'undefined') {
  module.exports = { extractUsesRefs, resolveActionUrl, parseWorkflowActions };
}
