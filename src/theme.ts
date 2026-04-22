// Self-contained design tokens. Kept inline instead of using the host
// app's Tailwind config so the package drops into any project — whether
// it's Tailwind, CSS modules, vanilla CSS, or a totally different theme.
//
// Opinionated dark palette inspired by the Vercel toolbar and modern
// in-product dev tooling.

export const theme = {
  void: "#0a0a0a",
  console: "#111111",
  pearl: "#f5f5f5",
  ash: "#737373",
  fader: "#2a2a2a",
  amber: "#f59e0b",
  amberDim: "rgba(245, 158, 11, 0.3)",
  amberHover: "rgba(245, 158, 11, 0.1)",
  deepRed: "#dc2626",
  deepRedDim: "rgba(220, 38, 38, 0.5)",
  rose: "#fb7185",
  roseBg: "rgba(220, 38, 38, 0.1)",
  roseBorder: "rgba(220, 38, 38, 0.2)",
} as const;

export const Z_LAUNCHER = 2147483000;
export const Z_OVERLAY = 2147483100;
export const Z_WIDGET = 2147483200;
