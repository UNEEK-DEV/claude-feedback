"use client";

import { useCallback, useEffect, useState } from "react";
import { submitFeedback } from "./submit-action";
import { submitFeedbackToInbox } from "./submit-inbox-action";
import { annotateScreenshot, captureScreenshot } from "./capture";
import { ElementPicker, type PickedElement } from "./element-picker";
import { FeedbackForm } from "./feedback-form";
import { IconReport } from "./icons";
import { ensureStyles } from "./styles";
import type { FeedbackTarget } from "./targets";
import { theme, Z_LAUNCHER, Z_WIDGET } from "./theme";

type Mode = "closed" | "picking" | "form" | "done";

export interface ClaudeFeedbackWidgetProps {
  /** Override default bottom-right corner position. */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Override the default launcher color ring. */
  accent?: string;
  /**
   * Available submit targets. Usually injected by the `<ClaudeFeedback />`
   * server gate based on env. Defaults to `["github"]` so direct usage of
   * the widget keeps working with just the GitHub vars.
   */
  targets?: FeedbackTarget[];
}

/**
 * The root widget. State machine:
 *   closed → (click launch) → picking → (click element OR Esc) → form → (submit) → done
 *
 * Small circular launcher — Vercel-toolbar vibe — sits ~44px in the
 * corner. One click jumps straight to element-picking so the common
 * case (element-specific bug) is zero extra clicks.
 */
export function ClaudeFeedbackWidget({
  position = "bottom-right",
  accent = theme.deepRed,
  targets = ["github"],
}: ClaudeFeedbackWidgetProps = {}) {
  const [mode, setMode] = useState<Mode>("closed");
  const [picked, setPicked] = useState<PickedElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultHint, setResultHint] = useState<string | null>(null);
  const [target, setTarget] = useState<FeedbackTarget>(targets[0] ?? "github");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureStyles();
  }, []);

  useEffect(() => {
    if (mode === "closed") {
      setPicked(null);
      setPreviewDataUrl(null);
      setScreenshotBlob(null);
      setSubmitting(false);
      setResultUrl(null);
      setResultHint(null);
      setError(null);
      setTarget(targets[0] ?? "github");
    }
  }, [mode, targets]);

  const handlePick = useCallback(async (picked: PickedElement) => {
    setPicked(picked);
    setMode("form");

    try {
      const shot = await captureScreenshot();
      const annotated = await annotateScreenshot(
        shot.blob,
        {
          x: picked.rect.left,
          y: picked.rect.top,
          width: picked.rect.width,
          height: picked.rect.height,
        },
        window.devicePixelRatio,
      );
      setScreenshotBlob(annotated);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setPreviewDataUrl(reader.result);
      };
      reader.readAsDataURL(annotated);
    } catch (err) {
      console.error("[claude-feedback] screenshot failed:", err);
    }
  }, []);

  const handleClearPick = useCallback(async () => {
    setPicked(null);
    try {
      const shot = await captureScreenshot();
      setScreenshotBlob(shot.blob);
      setPreviewDataUrl(shot.dataUrl);
    } catch (err) {
      console.error("[claude-feedback] screenshot failed:", err);
    }
  }, []);

  const handleSubmit = useCallback(
    async (title: string, description: string) => {
      setSubmitting(true);
      setError(null);

      try {
        let base64 = "";
        if (screenshotBlob) {
          const buf = await screenshotBlob.arrayBuffer();
          base64 = arrayBufferToBase64(buf);
        }

        const payload = {
          title,
          description,
          pageUrl: window.location.href,
          elementSelector: picked?.selector ?? null,
          elementSummary: picked?.text ?? null,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          screenshotBase64: base64,
        };

        if (target === "inbox") {
          const result = await submitFeedbackToInbox(payload);
          if (result.ok) {
            setResultUrl(null);
            setResultHint(`Dropped in ${result.markdownPath}`);
            setMode("done");
          } else {
            setError(result.error);
          }
        } else {
          const result = await submitFeedback(payload);
          if (result.ok) {
            setResultUrl(result.issueUrl);
            setResultHint(null);
            setMode("done");
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        console.error("[claude-feedback] submit failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [picked, screenshotBlob, target],
  );

  const corner = cornerStyle(position);

  return (
    <div
      data-claude-feedback-root="true"
      style={{
        position: "fixed",
        ...corner,
        pointerEvents: "none",
        zIndex: Z_LAUNCHER,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {mode === "closed" && (
        <button
          type="button"
          onClick={() => setMode("picking")}
          aria-label="Report an issue to Claude"
          className="claude-feedback-launcher claude-feedback-animate-in"
          style={{
            pointerEvents: "auto",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(10,10,10,0.95))",
            border: `1px solid ${accent}`,
            color: accent,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <IconReport size={18} color={accent} strokeWidth={2.2} />
        </button>
      )}

      {(mode === "form" || mode === "done") && (
        <div
          className="claude-feedback-animate-in"
          style={{
            pointerEvents: "auto",
            width: 360,
            maxWidth: "calc(100vw - 48px)",
            background: "rgba(17, 17, 17, 0.98)",
            border: `1px solid ${
              mode === "done" ? theme.amberDim : theme.fader
            }`,
            borderRadius: 8,
            boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: Z_WIDGET,
          }}
        >
          <FeedbackForm
            picked={picked}
            previewDataUrl={previewDataUrl}
            submitting={submitting}
            resultUrl={mode === "done" ? resultUrl : null}
            resultHint={mode === "done" ? resultHint : null}
            error={error}
            targets={targets}
            target={target}
            onTargetChange={setTarget}
            onRepick={() => setMode("picking")}
            onClearPick={handleClearPick}
            onSubmit={handleSubmit}
            onClose={() => setMode("closed")}
          />
        </div>
      )}

      {mode === "picking" && (
        <ElementPicker onPick={handlePick} onCancel={() => setMode("closed")} />
      )}
    </div>
  );
}

function cornerStyle(
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left",
): Record<string, number | string> {
  switch (position) {
    case "bottom-left":
      return { bottom: 24, left: 24 };
    case "top-right":
      return { top: 24, right: 24 };
    case "top-left":
      return { top: 24, left: 24 };
    default:
      return { bottom: 24, right: 24 };
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
