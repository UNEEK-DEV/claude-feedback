"use client";

import { useEffect, useRef, useState } from "react";
import { generateSelector } from "./selector";
import { theme, Z_OVERLAY } from "./theme";

export interface PickedElement {
  selector: string;
  tagName: string;
  text: string;
  rect: DOMRect;
}

interface ElementPickerProps {
  onPick: (picked: PickedElement) => void;
  onCancel: () => void;
}

/**
 * Full-viewport overlay. Reporter hovers → red outline appears around
 * the element. Click picks it; Esc cancels.
 *
 * Overlay itself is pointer-events:none so the real element below receives
 * the hover / click — we reach back via elementFromPoint to figure out
 * which one. The widget's own DOM (data-claude-feedback-root="true") is
 * skipped so the user can't pick the widget.
 */
export function ElementPicker({ onPick, onCancel }: ElementPickerProps) {
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const currentElRef = useRef<Element | null>(null);

  useEffect(() => {
    function isInsideWidget(el: Element | null): boolean {
      let node: Element | null = el;
      while (node) {
        if (
          node instanceof HTMLElement &&
          node.dataset.claudeFeedbackRoot === "true"
        ) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    function handleMove(e: MouseEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isInsideWidget(el)) {
        currentElRef.current = null;
        setHoverRect(null);
        return;
      }
      currentElRef.current = el;
      setHoverRect(el.getBoundingClientRect());
    }

    function handleClick(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      const el = currentElRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      onPick({
        selector: generateSelector(el),
        tagName: el.tagName.toLowerCase(),
        text: (el.textContent ?? "").trim().slice(0, 120),
        rect,
      });
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }

    window.addEventListener("mousemove", handleMove, { capture: true });
    window.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("keydown", handleKey, { capture: true });

    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    return () => {
      window.removeEventListener("mousemove", handleMove, { capture: true });
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("keydown", handleKey, { capture: true });
      document.body.style.cursor = originalCursor;
    };
  }, [onPick, onCancel]);

  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;

  return (
    <div
      data-claude-feedback-root="true"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: Z_OVERLAY,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${vw} ${vh}`}
        style={{ position: "absolute", inset: 0 }}
        role="presentation"
      >
        <title>Element highlight overlay</title>
        <defs>
          <mask id="claude-feedback-mask">
            <rect width="100%" height="100%" fill="white" />
            {hoverRect && (
              <rect
                x={hoverRect.left}
                y={hoverRect.top}
                width={hoverRect.width}
                height={hoverRect.height}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(5, 5, 5, 0.4)"
          mask="url(#claude-feedback-mask)"
        />
        {hoverRect && (
          <rect
            x={hoverRect.left}
            y={hoverRect.top}
            width={hoverRect.width}
            height={hoverRect.height}
            fill="none"
            stroke="rgb(220, 38, 38)"
            strokeWidth="2"
          />
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10, 10, 10, 0.95)",
          border: `1px solid ${theme.deepRedDim}`,
          padding: "8px 16px",
          borderRadius: 6,
          boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: theme.pearl,
          }}
        >
          Click the element you want to report ·{" "}
          <span style={{ color: theme.ash }}>Esc to cancel</span>
        </p>
      </div>
    </div>
  );
}
