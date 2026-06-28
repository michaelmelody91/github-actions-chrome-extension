---
emoji: 📋
description: Reads a feature-request issue and posts either clarifying questions or a structured implementation plan.
engine:
  id: copilot
  model: claude-sonnet-4.5
on:
  slash_command:
    name: plan
    events: [issues, issue_comment]
env:
    GH_TOKEN: ${{ github.token }}
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
steps:
  - name: Fetch issue data
    run: |
      mkdir -p /tmp/gh-aw/data
      gh issue view "${{ github.event.issue.number }}" \
        --json number,title,body,labels,comments \
        > /tmp/gh-aw/data/issue.json
safe-outputs:
  add-comment:
    max: 1
    hide-older-comments: true
  add-labels:
    allowed:
      - "status:needs-info"
      - "status:plan-proposed"
  remove-labels:
    allowed:
      - "status:needs-plan"
      - "status:needs-info"
      - "status:plan-proposed"
      - "status:approved"
      - "status:building"
      - "status:in-review"
network:
  allowed:
    - defaults
---

# Planner Agent

## Context

- **Repository**: ${{ github.repository }}
- **Issue**: #${{ github.event.issue.number }}

## Task

Read `/tmp/gh-aw/data/issue.json`. It contains the issue number, title, body, labels, and all
comments for the feature request.

### Step 1: Assess spec completeness

The issue body should contain all five sections from the feature-request form:
**Problem**, **Desired behavior**, **Acceptance criteria**, **Non-goals**, and **Validation**.

A spec is **insufficient** if any of the following is true:
- A required section is missing or empty
- Acceptance criteria lack concrete Given/When/Then scenarios, or are vague and untestable
- The desired behavior is ambiguous or contradicts other sections
- Non-goals are absent (even "None" is a valid answer)

### Step 2a: Insufficient spec — post clarifying questions

If the spec is insufficient:
1. Post a comment listing each gap as a specific question. Ask only what is needed to unblock
   planning. Do not fabricate a plan.
2. Use `remove-labels` to strip any current `status:*` label from the issue.
3. Use `add-labels` to set `status:needs-info`.

### Step 2b: Sufficient spec — post a structured plan

If the spec is sufficient, post a comment with the following four sections:

1. **Approach** — one paragraph summarizing the implementation strategy. Include an explanation of your rationalie.
2. **File-level impact** — a table of files to create/modify/delete with a brief reason for each
3. **Key code changes** - Define new functions that are to be added, functions that are to be updated or any other key details that can be represented in a sample diff or pseudo-code.
4. **Edge cases and risks** — a bullet list of non-obvious concerns the builder should watch for
5. **Validation plan** — each acceptance criterion from the issue mapped to the test commands
   in the Validation field

Then:
- Use `remove-labels` to strip any current `status:*` label.
- Use `add-labels` to set `status:plan-proposed`.

### Re-run behavior

If a plan comment already exists and new comments have been added since it was posted,
incorporate that feedback into an updated plan. Replace the previous plan — do not append.

If no new comments exist since the last plan and the issue already shows `status:plan-proposed`,
call `noop` with a brief reason.

## Safe Outputs

- Use `add-comment` to post clarifying questions or the plan. Previous plan comments are hidden
  automatically by `hide-older-comments`.
- Use `add-labels` and `remove-labels` so the issue carries exactly one `status:*` label.
- Call `noop` when no new output is required.
