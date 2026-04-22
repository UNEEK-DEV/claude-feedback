import type { CSSProperties } from "react";

// Inline SVG icon components. Keeps the package free of lucide-react as
// a dep. Size + color always controllable via props.

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
  strokeWidth?: number;
}

function base({
  size = 16,
  color = "currentColor",
  style,
  className,
  strokeWidth = 2,
}: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
    className,
    "aria-hidden": true,
  };
}

export function IconReport(props: IconProps) {
  // Sparkle-bolt — a bit more "Claude" than a plain bug / message.
  return (
    <svg {...base(props)}>
      <path d="M13 3 L4 14 L12 14 L11 21 L20 10 L12 10 Z" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function IconSpinner(props: IconProps) {
  return (
    <svg {...base(props)} className={`claude-feedback-spin ${props.className ?? ""}`}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
