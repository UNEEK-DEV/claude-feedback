"use server";

import { randomUUID } from "node:crypto";
import { buildFeedbackBody } from "./body";

export interface FeedbackPayload {
  title: string;
  description: string;
  pageUrl: string;
  elementSelector: string | null;
  elementSummary: string | null;
  userAgent: string;
  viewport: { width: number; height: number };
  /** Base64 PNG, no data: prefix. Empty string skips upload. */
  screenshotBase64: string;
}

export interface SubmitResult {
  ok: true;
  issueUrl: string;
  issueNumber: number;
}

export interface SubmitError {
  ok: false;
  error: string;
}

/**
 * Create a GitHub issue tagged `@claude` so Claude Code Action picks it up.
 *
 * Env contract:
 *   - CLAUDE_FEEDBACK_ENABLED    master toggle ("1" | "true" to enable)
 *   - GITHUB_REPO                "owner/name" format
 *   - GITHUB_FEEDBACK_TOKEN      fine-grained PAT w/ issues:write
 *   - CLAUDE_FEEDBACK_LABELS         optional CSV, defaults to "dev-feedback,claude-task"
 *   - BLOB_PUBLIC_READ_WRITE_TOKEN   optional — preferred. Token for a
 *                                    PUBLIC Vercel Blob store. Required
 *                                    because GitHub fetches issue
 *                                    images anonymously.
 *   - BLOB_READ_WRITE_TOKEN          optional — fallback for single-store
 *                                    apps. The store must be public, or
 *                                    the upload will fail with
 *                                    "Cannot use public access on a
 *                                    private store".
 */
export async function submitFeedback(
  payload: FeedbackPayload,
): Promise<SubmitResult | SubmitError> {
  if (!isEnabled()) {
    return { ok: false, error: "Claude Feedback is disabled" };
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  if (!repo || !token) {
    return {
      ok: false,
      error:
        "GITHUB_REPO and GITHUB_FEEDBACK_TOKEN must be set in the environment",
    };
  }

  let screenshotUrl: string | null = null;
  if (payload.screenshotBase64) {
    try {
      screenshotUrl = await maybeUploadScreenshot(payload.screenshotBase64);
    } catch (err) {
      console.error("[claude-feedback] screenshot upload failed:", err);
    }
  }

  const body = buildFeedbackBody(
    payload,
    screenshotUrl ? { kind: "url", url: screenshotUrl } : null,
  );
  const labels = parseLabels(process.env.CLAUDE_FEEDBACK_LABELS);

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title: payload.title.slice(0, 200),
      body,
      labels,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[claude-feedback] GitHub issue create failed:", errText);
    return {
      ok: false,
      error: `GitHub issue create failed: ${res.status} ${res.statusText}`,
    };
  }

  const issue = (await res.json()) as { html_url: string; number: number };

  return {
    ok: true,
    issueUrl: issue.html_url,
    issueNumber: issue.number,
  };
}

function isEnabled(): boolean {
  const v = process.env.CLAUDE_FEEDBACK_ENABLED;
  if (!v) return false;
  return v === "1" || v.toLowerCase() === "true";
}

function parseLabels(raw: string | undefined): string[] {
  if (!raw) return ["dev-feedback", "claude-task"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Upload the screenshot to a PUBLIC Vercel Blob store and return its URL.
 *
 * Prefers BLOB_PUBLIC_READ_WRITE_TOKEN (apps that split private/public
 * stores) and falls back to BLOB_READ_WRITE_TOKEN for single-store apps.
 * The resolved store MUST be public — GitHub fetches issue-body images
 * anonymously, so a private store will reject `access: "public"`.
 *
 * Returns null if neither token is set or @vercel/blob isn't installed —
 * the issue will simply render without the image.
 */
async function maybeUploadScreenshot(base64: string): Promise<string | null> {
  const token =
    process.env.BLOB_PUBLIC_READ_WRITE_TOKEN ??
    process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  let blobModule: typeof import("@vercel/blob") | null = null;
  try {
    blobModule = await import("@vercel/blob");
  } catch {
    console.warn(
      "[claude-feedback] a Blob token is set but @vercel/blob is not installed — skipping screenshot upload. `npm i @vercel/blob` to enable.",
    );
    return null;
  }

  const buffer = Buffer.from(base64, "base64");
  const id = randomUUID();
  const { url } = await blobModule.put(
    `claude-feedback/${id}.png`,
    buffer,
    {
      access: "public",
      contentType: "image/png",
      token,
    },
  );
  return url;
}

