import type { FeedbackPayload } from "./submit-action";

/**
 * Shared markdown body formatter. Used by:
 *   - `submitFeedback` (GitHub issue body)
 *   - `submitFeedbackToInbox` (local inbox file body)
 *
 * Keeping one formatter means the two target formats stay in sync so a
 * handoff between inbox → GitHub (or vice versa) reads identically.
 */
export function buildFeedbackBody(
  payload: FeedbackPayload,
  screenshotRef: { kind: "url"; url: string } | { kind: "file"; path: string } | null,
): string {
  const lines: string[] = [];

  lines.push("@claude please investigate this in-product feedback.");
  lines.push("");
  lines.push("## What's wrong");
  lines.push(payload.description);
  lines.push("");

  lines.push("## Where");
  lines.push(`- **Page:** ${payload.pageUrl}`);
  if (payload.elementSelector) {
    lines.push(`- **Element:** \`${payload.elementSelector}\``);
  }
  if (payload.elementSummary) {
    lines.push(`- **Element text:** ${truncate(payload.elementSummary, 200)}`);
  }
  lines.push("");

  if (screenshotRef?.kind === "url") {
    lines.push("## Screenshot");
    lines.push(`![screenshot](${screenshotRef.url})`);
    lines.push("");
  } else if (screenshotRef?.kind === "file") {
    lines.push("## Screenshot");
    lines.push(`![screenshot](${screenshotRef.path})`);
    lines.push("");
  } else if (payload.screenshotBase64) {
    lines.push("## Screenshot");
    lines.push(
      "_Screenshot was captured but no storage is configured — set BLOB_READ_WRITE_TOKEN (GitHub target) or CLAUDE_FEEDBACK_INBOX_DIR (local target) to embed images._",
    );
    lines.push("");
  }

  lines.push("## Reproduction context");
  lines.push(
    `- **Viewport:** ${payload.viewport.width}×${payload.viewport.height}`,
  );
  lines.push(`- **User agent:** \`${payload.userAgent}\``);
  lines.push("");

  lines.push("---");
  lines.push(
    "_Filed via the in-product Claude Feedback widget. Reply with a plan before landing the fix._",
  );

  return lines.join("\n");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
