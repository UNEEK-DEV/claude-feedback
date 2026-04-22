"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { buildFeedbackBody } from "./body";
import type { FeedbackPayload, SubmitError } from "./submit-action";

export interface InboxSubmitResult {
  ok: true;
  inboxPath: string;
  markdownPath: string;
  screenshotPath: string | null;
}

/**
 * Drop feedback into a local inbox directory so a Claude Code session
 * watching that path picks it up. A tether, not a webhook.
 *
 * Env contract:
 *   - CLAUDE_FEEDBACK_ENABLED     master toggle ("1" | "true")
 *   - CLAUDE_FEEDBACK_INBOX_DIR   absolute path to write into
 *
 * File layout written per submission:
 *   <inbox>/YYYY-MM-DDTHH-MM-SS-<slug>-<id>.md
 *   <inbox>/YYYY-MM-DDTHH-MM-SS-<slug>-<id>.png    (when a screenshot is present)
 *
 * The markdown body matches the GitHub issue body one-for-one so a Claude
 * session reads the same thing whether the feedback came through GitHub or
 * the inbox.
 */
export async function submitFeedbackToInbox(
  payload: FeedbackPayload,
): Promise<InboxSubmitResult | SubmitError> {
  if (!isEnabled()) {
    return { ok: false, error: "Claude Feedback is disabled" };
  }

  const inboxDir = process.env.CLAUDE_FEEDBACK_INBOX_DIR;
  if (!inboxDir) {
    return {
      ok: false,
      error:
        "CLAUDE_FEEDBACK_INBOX_DIR must be set to an absolute path for inbox submissions",
    };
  }

  const abs = resolve(inboxDir);
  try {
    await mkdir(abs, { recursive: true });
  } catch (err) {
    console.error("[claude-feedback] inbox mkdir failed:", err);
    return { ok: false, error: "Couldn't create inbox directory" };
  }

  const stamp = new Date()
    .toISOString()
    .replace(/[:]/g, "-")
    .replace(/\.\d+Z$/, "Z");
  const slug = slugify(payload.title) || "feedback";
  const id = randomUUID().slice(0, 8);
  const base = `${stamp}-${slug}-${id}`;

  const markdownPath = resolve(abs, `${base}.md`);
  let screenshotPath: string | null = null;

  if (payload.screenshotBase64) {
    screenshotPath = resolve(abs, `${base}.png`);
    try {
      await writeFile(
        screenshotPath,
        Buffer.from(payload.screenshotBase64, "base64"),
      );
    } catch (err) {
      console.error("[claude-feedback] screenshot write failed:", err);
      screenshotPath = null;
    }
  }

  const body = buildFeedbackBody(
    payload,
    screenshotPath ? { kind: "file", path: `./${base}.png` } : null,
  );

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(payload.title)}`,
    `page: ${JSON.stringify(payload.pageUrl)}`,
    `received_at: ${new Date().toISOString()}`,
    payload.elementSelector
      ? `element: ${JSON.stringify(payload.elementSelector)}`
      : null,
    "source: claude-feedback-inbox",
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await writeFile(markdownPath, `${frontmatter}# ${payload.title}\n\n${body}\n`);
  } catch (err) {
    console.error("[claude-feedback] markdown write failed:", err);
    return { ok: false, error: "Couldn't write feedback to inbox" };
  }

  return {
    ok: true,
    inboxPath: abs,
    markdownPath,
    screenshotPath,
  };
}

function isEnabled(): boolean {
  const v = process.env.CLAUDE_FEEDBACK_ENABLED;
  if (!v) return false;
  return v === "1" || v.toLowerCase() === "true";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
