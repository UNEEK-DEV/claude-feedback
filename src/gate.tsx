import { ClaudeFeedbackWidget, type ClaudeFeedbackWidgetProps } from "./widget";
import type { FeedbackTarget } from "./targets";

/**
 * Drop this anywhere in your app tree (ideally `app/layout.tsx`).
 *
 * It runs on the server, checks `process.env.CLAUDE_FEEDBACK_ENABLED`,
 * and either returns null or renders the client widget. No bundle cost
 * for non-enabled builds beyond this tiny gate.
 *
 * Available targets are derived from env at render time:
 *   - "github" — when GITHUB_REPO + GITHUB_FEEDBACK_TOKEN are set
 *   - "inbox"  — when CLAUDE_FEEDBACK_INBOX_DIR is set
 *
 * When both are configured the widget shows a small selector. When only
 * one is configured, no selector — just that path.
 *
 * Minimum .env:
 *   CLAUDE_FEEDBACK_ENABLED=1
 *
 * GitHub target:
 *   GITHUB_REPO=owner/repo
 *   GITHUB_FEEDBACK_TOKEN=github_pat_...
 *   CLAUDE_FEEDBACK_LABELS=dev-feedback,claude-task   (optional)
 *   BLOB_READ_WRITE_TOKEN=...                         (optional)
 *
 * Inbox target (local filesystem drop):
 *   CLAUDE_FEEDBACK_INBOX_DIR=/absolute/path/to/inbox
 */
export function ClaudeFeedback(props: ClaudeFeedbackWidgetProps = {}) {
  const raw = process.env.CLAUDE_FEEDBACK_ENABLED;
  const enabled = raw === "1" || raw?.toLowerCase() === "true";
  if (!enabled) return null;

  const targets: FeedbackTarget[] = [];
  if (process.env.GITHUB_REPO && process.env.GITHUB_FEEDBACK_TOKEN) {
    targets.push("github");
  }
  if (process.env.CLAUDE_FEEDBACK_INBOX_DIR) {
    targets.push("inbox");
  }

  if (targets.length === 0) return null;

  return <ClaudeFeedbackWidget {...props} targets={targets} />;
}
