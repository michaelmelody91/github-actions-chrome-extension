const assert = require('assert');
const { extractUsesRefs, resolveActionUrl, parseWorkflowActions } = require('../src/parser.js');

const ctx = { owner: 'myorg', repo: 'myrepo', ref: 'main' };

// extractUsesRefs
{
  const yaml = [
    'on: push',
    'jobs:',
    '  build:',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v3',
    '      # - uses: docker://alpine:3',
    '      - name: run',
    '        run: echo hi',
  ].join('\n');

  const refs = extractUsesRefs(yaml);
  assert.strictEqual(refs.length, 2, 'extracts 2 uses refs');
  assert.strictEqual(refs[0].lineNumber, 5);
  assert.strictEqual(refs[0].actionRef, 'actions/checkout@v4');
  assert.strictEqual(refs[1].lineNumber, 6);
  assert.strictEqual(refs[1].actionRef, 'actions/setup-node@v3');
  console.log('✓ extractUsesRefs: basic extraction and comment skipping');
}

// resolveActionUrl — tag ref
{
  const url = resolveActionUrl('actions/checkout@v4', ctx);
  assert.strictEqual(url, 'https://github.com/actions/checkout');
  console.log('✓ resolveActionUrl: tag ref → repo root');
}

// resolveActionUrl — full SHA
{
  const url = resolveActionUrl('actions/checkout@a81bbbf8298c0fa03ea29cdc473d45769f953675', ctx);
  assert.strictEqual(url, 'https://github.com/actions/checkout/tree/a81bbbf8298c0fa03ea29cdc473d45769f953675');
  console.log('✓ resolveActionUrl: full SHA → tree at SHA');
}

// resolveActionUrl — short SHA (7 chars)
{
  const url = resolveActionUrl('actions/checkout@a81bbbf', ctx);
  assert.strictEqual(url, 'https://github.com/actions/checkout/tree/a81bbbf');
  console.log('✓ resolveActionUrl: short SHA → tree at SHA');
}

// resolveActionUrl — subdirectory action
{
  const url = resolveActionUrl('org/repo/path/to/action@v1', ctx);
  assert.strictEqual(url, 'https://github.com/org/repo/tree/v1/path/to/action');
  console.log('✓ resolveActionUrl: subdir action → tree at ref + path');
}

// resolveActionUrl — local action
{
  const url = resolveActionUrl('./.github/actions/my-action', ctx);
  assert.strictEqual(url, 'https://github.com/myorg/myrepo/tree/main/.github/actions/my-action');
  console.log('✓ resolveActionUrl: local action → current repo tree');
}

// resolveActionUrl — docker
{
  const url = resolveActionUrl('docker://alpine:3.8', ctx);
  assert.strictEqual(url, null);
  console.log('✓ resolveActionUrl: docker:// → null');
}

// resolveActionUrl — missing @ sign
{
  const url = resolveActionUrl('actions/checkout', ctx);
  assert.strictEqual(url, null);
  console.log('✓ resolveActionUrl: missing @ → null');
}

// resolveActionUrl — branch ref (not SHA) stays at root
{
  const url = resolveActionUrl('actions/checkout@main', ctx);
  assert.strictEqual(url, 'https://github.com/actions/checkout');
  console.log('✓ resolveActionUrl: branch ref → repo root (not tree)');
}

// parseWorkflowActions — integration: docker filtered out
{
  const yaml = [
    'steps:',
    '  - uses: actions/checkout@v4',
    '  - uses: docker://alpine:3',
    '  - uses: ./.github/actions/local',
  ].join('\n');

  const actions = parseWorkflowActions(yaml, ctx);
  assert.strictEqual(actions.length, 2, 'docker filtered out');
  assert.strictEqual(actions[0].url, 'https://github.com/actions/checkout');
  assert.strictEqual(actions[1].url, 'https://github.com/myorg/myrepo/tree/main/.github/actions/local');
  console.log('✓ parseWorkflowActions: filters nulls, resolves mixed refs');
}

console.log('\nAll tests passed.');
