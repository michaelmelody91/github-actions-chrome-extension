(function () {
  'use strict';

  var actionMap = new Map(); // lineNumber (number) → url (string)
  var observer = null;
  var debounceTimer = null;
  var lastUrl = location.href;

  // --- URL detection ---

  function parseWorkflowUrl(url) {
    var match = url.match(
      /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/.github\/workflows\/[^/]+\.ya?ml(\?|#|$)/
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2], ref: match[3] };
  }

  function buildRawUrl(ctx) {
    var pathMatch = location.pathname.match(/\/blob\/[^/]+\/(.+)/);
    var filePath = pathMatch ? pathMatch[1] : '';
    return 'https://raw.githubusercontent.com/' + ctx.owner + '/' + ctx.repo + '/' + ctx.ref + '/' + filePath;
  }

  // --- Affordance injection ---

  var MARKER = 'data-gha-link';

  function injectAffordance(lineNumber, url) {
    try {
      var cell = queryFallback(SELECTORS.lineNumberCell, lineNumber);
      if (!cell) return;
      if (cell.getAttribute(MARKER) === String(lineNumber)) return; // idempotent

      cell.classList.add('gha-line-number-cell');

      var label = cell.querySelector('.gha-line-number');
      if (!label) {
        label = document.createElement('span');
        label.className = 'gha-line-number';
        label.textContent = String(lineNumber);
        cell.insertBefore(label, cell.firstChild);
      }
      // GitHub currently renders these cells as plain numeric text, so we keep
      // the visible number in a span we control and place the CTA beside it.
      if (label.textContent !== String(lineNumber)) {
        label.textContent = String(lineNumber);
      }

      var link = cell.querySelector('.gha-action-link');
      if (!link) {
        link = document.createElement('a');
        link.className = 'gha-action-link';
        link.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" aria-hidden="true">' +
          '<path fill-rule="evenodd" d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"/>' +
          '</svg>';
        cell.appendChild(link);
      }
      if (link.href !== url) link.href = url;
      if (link.getAttribute('aria-label') !== 'Open action repository') {
        link.setAttribute('aria-label', 'Open action repository');
      }
      if (link.title !== 'Open action repository') {
        link.title = 'Open action repository';
      }

      // Store the line number so if the DOM node is re-used for a different line
      // (React virtualisation) we'll detect the mismatch and re-inject.
      cell.setAttribute(MARKER, String(lineNumber));
    } catch (err) {
      console.warn('[gha-links] failed to inject affordance for line', lineNumber, err);
    }
  }

  function processVisibleLines() {
    if (actionMap.size === 0) return;
    actionMap.forEach(function (url, lineNumber) {
      injectAffordance(lineNumber, url);
    });
  }

  // --- Observer ---

  function startObserver() {
    var container = queryFallback(SELECTORS.codeContainer) || document.body;
    observer = new MutationObserver(function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processVisibleLines, 80);
    });
    observer.observe(container, { childList: true, subtree: true });
  }

  function disconnectObserver() {
    if (observer) { observer.disconnect(); observer = null; }
    clearTimeout(debounceTimer);
  }

  // --- Main ---

  function initialize() {
    actionMap.clear();
    disconnectObserver();

    var ctx = parseWorkflowUrl(location.href);
    if (!ctx) return;

    var rawUrl = buildRawUrl(ctx);
    fetch(rawUrl)
      .then(function (resp) {
        if (!resp.ok) {
          console.warn('[gha-links] fetch failed', resp.status, rawUrl);
          return null;
        }
        return resp.text();
      })
      .then(function (yamlText) {
        if (!yamlText) return;
        var actions = parseWorkflowActions(yamlText, ctx);
        if (actions.length === 0) {
          console.warn('[gha-links] no resolvable uses: references found in', rawUrl);
        }
        actions.forEach(function (item) {
          actionMap.set(item.lineNumber, item.url);
        });
        processVisibleLines();
        startObserver();
      })
      .catch(function (err) {
        console.warn('[gha-links] unexpected error during initialisation', err);
      });
  }

  // --- SPA navigation ---

  document.addEventListener('turbo:load', initialize);
  document.addEventListener('pjax:end', initialize);

  // Fallback URL poll for navigation events we might miss
  setInterval(function () {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      initialize();
    }
  }, 1000);

  initialize();
})();
