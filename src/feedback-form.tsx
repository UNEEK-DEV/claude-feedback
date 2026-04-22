"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { IconClose, IconExternal, IconSpinner, IconTarget } from "./icons";
import { theme } from "./theme";
import type { PickedElement } from "./element-picker";
import { TARGET_LABELS, type FeedbackTarget } from "./targets";

interface FeedbackFormProps {
  picked: PickedElement | null;
  previewDataUrl: string | null;
  submitting: boolean;
  resultUrl: string | null;
  resultHint: string | null;
  error: string | null;
  targets: FeedbackTarget[];
  target: FeedbackTarget;
  onTargetChange: (target: FeedbackTarget) => void;
  onRepick: () => void;
  onClearPick: () => void;
  onSubmit: (title: string, description: string) => void;
  onClose: () => void;
}

const FONT =
  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

const label: CSSProperties = {
  display: "block",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: theme.ash,
  marginBottom: 4,
};

const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: theme.void,
  border: `1px solid ${theme.fader}`,
  outline: "none",
  padding: "8px 12px",
  color: theme.pearl,
  fontSize: 13,
  borderRadius: 4,
  fontFamily: FONT,
};

const textarea: CSSProperties = { ...input, resize: "none" };

const ghost: CSSProperties = {
  background: "transparent",
  border: "none",
  color: theme.ash,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  cursor: "pointer",
  padding: "2px 4px",
  fontFamily: FONT,
};

export function FeedbackForm({
  picked,
  previewDataUrl,
  submitting,
  resultUrl,
  resultHint,
  error,
  targets,
  target,
  onTargetChange,
  onRepick,
  onClearPick,
  onSubmit,
  onClose,
}: FeedbackFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = title.trim().length > 3 && description.trim().length > 5;
  const showSelector = targets.length > 1;

  // Success state — either a GitHub issue URL (github target) or a local
  // path hint (inbox target).
  if (resultUrl || resultHint) {
    return (
      <div style={{ padding: 20, fontFamily: FONT }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.3em",
                color: theme.amber,
                marginBottom: 4,
              }}
            >
              {resultUrl ? "Filed" : "Tethered"}
            </p>
            <h3
              style={{
                margin: 0,
                color: theme.pearl,
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              Claude is on it.
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="claude-feedback-ghost"
            style={{ ...ghost, padding: 8, marginRight: -8, marginTop: -8 }}
            aria-label="Close"
          >
            <IconClose size={16} />
          </button>
        </div>
        <p
          style={{
            color: "rgba(245, 245, 245, 0.8)",
            fontSize: 13,
            lineHeight: 1.55,
            marginBottom: 16,
          }}
        >
          {resultUrl
            ? "The issue is filed and tagged. Claude will reply with a plan — you'll get a GitHub notification."
            : "Dropped in your local inbox. A Claude Code session watching that directory will pick it up."}
        </p>
        {resultUrl ? (
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="claude-feedback-link-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: theme.amber,
              border: `1px solid ${theme.amberDim}`,
              padding: "8px 12px",
              borderRadius: 4,
              textDecoration: "none",
            }}
          >
            View issue <IconExternal size={12} />
          </a>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: theme.ash,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
              wordBreak: "break-all",
            }}
          >
            {resultHint}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !submitting) onSubmit(title.trim(), description.trim());
      }}
      style={{ padding: 20, fontFamily: FONT }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: theme.deepRed,
              marginBottom: 4,
            }}
          >
            Send to Claude
          </p>
          <h3
            style={{
              margin: 0,
              color: theme.pearl,
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Report something
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="claude-feedback-ghost"
          style={{ ...ghost, padding: 8, marginRight: -8, marginTop: -8 }}
          aria-label="Close"
        >
          <IconClose size={16} />
        </button>
      </div>

      {/* Target summary */}
      <div
        style={{
          marginBottom: 16,
          background: "rgba(10, 10, 10, 0.4)",
          border: `1px solid ${theme.fader}`,
          borderRadius: 4,
          padding: "6px 10px",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <IconTarget size={12} color={theme.amber} />
        {picked ? (
          <>
            <span
              style={{
                color: theme.pearl,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: theme.ash }}>&lt;{picked.tagName}&gt;</span>{" "}
              {picked.text
                ? `"${picked.text.slice(0, 40)}${
                    picked.text.length > 40 ? "…" : ""
                  }"`
                : picked.selector}
            </span>
            <button
              type="button"
              onClick={onClearPick}
              className="claude-feedback-ghost"
              style={ghost}
            >
              Whole page
            </button>
            <button
              type="button"
              onClick={onRepick}
              className="claude-feedback-ghost"
              style={ghost}
            >
              Re-pick
            </button>
          </>
        ) : (
          <>
            <span style={{ color: theme.pearl, flex: 1 }}>Whole page</span>
            <button
              type="button"
              onClick={onRepick}
              className="claude-feedback-ghost"
              style={ghost}
            >
              Pick element
            </button>
          </>
        )}
      </div>

      {previewDataUrl && (
        <div
          style={{
            marginBottom: 16,
            border: `1px solid ${theme.fader}`,
            borderRadius: 4,
            overflow: "hidden",
            background: theme.void,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewDataUrl}
            alt="Screenshot preview"
            style={{
              width: "100%",
              height: 96,
              objectFit: "cover",
              objectPosition: "top",
              opacity: 0.8,
              display: "block",
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <span style={label}>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Button doesn't fire on mobile"
          disabled={submitting}
          className="claude-feedback-input"
          style={input}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>What's happening</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tapping the Apply button does nothing — expected to navigate to /casting."
          rows={4}
          disabled={submitting}
          className="claude-feedback-input"
          style={textarea}
        />
      </div>

      {showSelector && (
        <div style={{ marginBottom: 12 }}>
          <span style={label}>Destination</span>
          <div
            role="tablist"
            aria-label="Feedback destination"
            style={{
              display: "flex",
              border: `1px solid ${theme.fader}`,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {targets.map((t, i) => {
              const selected = t === target;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onTargetChange(t)}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    fontWeight: 600,
                    background: selected ? theme.amber : "transparent",
                    color: selected ? theme.void : theme.ash,
                    border: "none",
                    borderLeft: i === 0 ? "none" : `1px solid ${theme.fader}`,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: FONT,
                  }}
                >
                  {TARGET_LABELS[t]}
                </button>
              );
            })}
          </div>
          <p
            style={{
              margin: "6px 2px 0",
              fontSize: 10,
              color: theme.ash,
              lineHeight: 1.4,
            }}
          >
            {target === "inbox"
              ? "Dropped in the local inbox for the Claude session watching this repo."
              : "Filed as a GitHub issue tagged @claude."}
          </p>
        </div>
      )}

      {error && (
        <p
          style={{
            marginBottom: 12,
            fontSize: 11,
            color: theme.rose,
            background: theme.roseBg,
            border: `1px solid ${theme.roseBorder}`,
            borderRadius: 4,
            padding: "6px 10px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="claude-feedback-button-primary"
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.25em",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 4,
          border: "none",
          cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
          background:
            canSubmit && !submitting ? theme.amber : "rgba(64, 64, 64, 0.5)",
          color: canSubmit && !submitting ? theme.void : theme.ash,
          fontFamily: FONT,
        }}
      >
        {submitting && <IconSpinner size={14} />}
        {submitting
          ? target === "inbox" ? "Dropping…" : "Filing…"
          : target === "inbox" ? "Send to Claude (here)" : "Send to Claude"}
      </button>
    </form>
  );
}
