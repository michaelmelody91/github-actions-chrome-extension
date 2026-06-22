// Centralized DOM selectors — all fallback-ordered arrays.
// A GitHub UI change is a one-line fix here, not a codebase hunt.

var SELECTORS = {
  // Line-number cell for line N (substitute {n}).
  // The `data-line-number` attribute and `id="L{n}"` support GitHub's public permalink
  // format and have been stable for many years across both legacy and React code views.
  lineNumberCell: [
    'td[data-line-number="{n}"]',  // legacy blob view
    '#L{n}',                        // also legacy (permalink anchor)
    '[data-line-number="{n}"]',    // React / new code view fallback
  ],
  // Outermost code container to watch with MutationObserver
  codeContainer: [
    '.js-file-content',
    '.react-code-file-contents',
    '[data-testid="file-contents"]',
    '.blob-wrapper',
  ],
};

function resolveSelector(template, lineNumber) {
  return template.replace(/\{n\}/g, String(lineNumber));
}

function queryFallback(selectors, lineNumber, root) {
  root = root || document;
  for (var i = 0; i < selectors.length; i++) {
    try {
      var sel = lineNumber !== undefined
        ? resolveSelector(selectors[i], lineNumber)
        : selectors[i];
      var el = root.querySelector(sel);
      if (el) return el;
    } catch (_) {
      // Invalid selector in this environment — try next
    }
  }
  return null;
}

if (typeof module !== 'undefined') {
  module.exports = { SELECTORS, resolveSelector, queryFallback };
}
