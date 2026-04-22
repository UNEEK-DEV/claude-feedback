# @uneek/claude-feedback

Drop-in in-product feedback widget for Next.js apps. A small circular
launcher lives in the corner of your site; you click it, pick an
element, describe the bug, and it gets to Claude one of two ways:

1. **GitHub issue** — filed with `@claude` tagged so
   [Claude Code Action](https://github.com/anthropics/claude-code-action)
   picks it up and starts working on a fix.
2. **Local inbox** — dropped as a dated markdown file (plus PNG) into a
   directory on your machine. A live Claude Code session watching that
   directory reads it and starts work. A tether, not a webhook.

Which targets appear in the widget is driven entirely by env: set the
GitHub vars and you get the GitHub button, set `CLAUDE_FEEDBACK_INBOX_DIR`
and you get the inbox button, set both and you get a small selector.

One master `.env` flag toggles the whole thing on or off. Zero bundle cost
when disabled.

## Install

```bash
npm i @uneek/claude-feedback
# optional — only needed if you want screenshots embedded in issues
npm i @vercel/blob
```

## Configure

Add to `next.config.ts` so the raw TypeScript source is transpiled by
your build (the package ships as source to preserve `"use client"` and
`"use server"` directives exactly):

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@uneek/claude-feedback"],
};

export default nextConfig;
```

## Env vars

```bash
# Master toggle. Must be "1" or "true" for the widget to render or submit.
CLAUDE_FEEDBACK_ENABLED=1

# ─── GitHub target ────────────────────────────────────────────────
# Both vars must be set to expose the GitHub button.

GITHUB_REPO=neekmode/my-app                     # "owner/name"
GITHUB_FEEDBACK_TOKEN=github_pat_...            # fine-grained PAT w/ Issues:RW

# Optional — defaults to "dev-feedback,claude-task"
CLAUDE_FEEDBACK_LABELS=dev-feedback,claude-task

# Optional — embed annotated screenshots in issues.
# Requires @vercel/blob installed.
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# ─── Inbox target (tether) ────────────────────────────────────────
# Absolute path on the machine running the Next.js server. The widget
# drops a dated markdown file (and optional PNG) into this directory.
# Obviously this is a dev/local thing — on Vercel the filesystem is
# ephemeral, so in production set only the GitHub vars.

CLAUDE_FEEDBACK_INBOX_DIR=/Users/you/Workspace/my-app/.claude-inbox
```

## Use

Drop the component into your root layout. It's a **server component** —
it reads `process.env.CLAUDE_FEEDBACK_ENABLED` at render time and
returns `null` on disabled builds.

```tsx
// app/layout.tsx
import { ClaudeFeedback } from "@uneek/claude-feedback";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ClaudeFeedback />
      </body>
    </html>
  );
}
```

That's it. When `CLAUDE_FEEDBACK_ENABLED=1`, a small circle launcher
appears in the bottom-right corner. Click it, pick an element (or press
`Esc` to report the whole page), fill in title + description, choose a
destination if both are configured, and hit **Send to Claude**.

## Picking up inbox drops

When a drop lands in `CLAUDE_FEEDBACK_INBOX_DIR`, wire your Claude Code
session to see it. A couple of options:

- Watch the directory manually (`ls $CLAUDE_FEEDBACK_INBOX_DIR` before
  your next prompt).
- Configure a `SessionStart` or `UserPromptSubmit` hook in
  `~/.claude/settings.json` that lists the unread inbox contents and
  surfaces them at the top of your next turn.
- Pair with your own file-watcher / macOS notification script.

The package does not bundle a watcher — it stops at the drop. Drops are
append-only; delete / archive them yourself once handled.

## Options

```tsx
<ClaudeFeedback
  position="bottom-right" // bottom-right | bottom-left | top-right | top-left
  accent="#dc2626"        // launcher border + icon color
/>
```

## How the pickup works

Issues are filed with:

- Title you typed
- `@claude please investigate this in-product feedback.` as the first line
  of the body
- Page URL, element CSS selector, element text, viewport, user-agent
- Embedded screenshot (if blob upload is configured)
- Labels: `dev-feedback`, `claude-task` (override via
  `CLAUDE_FEEDBACK_LABELS`)

If your repo has [Claude Code Action](https://github.com/anthropics/claude-code-action)
installed, the `@claude` mention triggers it automatically.

Example workflow (save as `.github/workflows/claude.yml` in the target repo):

```yaml
name: Claude Code
on:
  issues:
    types: [opened]
  issue_comment:
    types: [created]
jobs:
  claude:
    if: contains(github.event.issue.body, '@claude') || contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Recommended: gate by environment

Set `CLAUDE_FEEDBACK_ENABLED=1` only on preview / staging so the widget
doesn't ship to real users. In Vercel, configure the env var per
environment:

- **Production**: omit, or set `0`
- **Preview**: `1`
- **Development**: `1`

Because the toggle is checked server-side inside `<ClaudeFeedback />`,
production builds don't even include the client bundle when disabled.

## Security

- `GITHUB_FEEDBACK_TOKEN` is never exposed to the client — it's only
  read inside the server action.
- The submit server action re-checks `CLAUDE_FEEDBACK_ENABLED` before
  hitting the GitHub API, so an attacker can't invoke the action on a
  production build where the flag is off.
- The PAT should be **fine-grained** and scoped to a single repo with
  `Issues: Read and write` and nothing else.
- If you want auth gating on top of the env flag (e.g. only admins see
  the widget), wrap `<ClaudeFeedback />` in your own server component
  that checks the session and returns `null` for non-admins.

## What's under the hood

- Small circular launcher (44px, pulsing red ring) — Vercel-toolbar vibe
- Element picker with a dimmer + red outline
- Annotated PNG screenshot (burned-in red rectangle) via `html-to-image`
  (dynamically imported, ~60 KB that only lands when the widget opens)
- Server action that files the GitHub issue
- Optional Vercel Blob upload for the screenshot

## License

MIT
