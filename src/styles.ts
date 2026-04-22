// One-time stylesheet injection for animations & keyframes. We scope
// every rule with the `.claude-feedback-*` prefix so we never leak into
// the host app's styles. Injected on first mount; idempotent.

const STYLE_ID = "claude-feedback-styles";

export function ensureStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

const CSS = `
@keyframes claude-feedback-fade-in {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}

@keyframes claude-feedback-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.35); }
  50%      { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
}

@keyframes claude-feedback-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.claude-feedback-animate-in {
  animation: claude-feedback-fade-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.claude-feedback-launcher {
  animation: claude-feedback-pulse 2.4s ease-out infinite;
  transition: transform 140ms ease-out, background 140ms ease-out, border-color 140ms ease-out;
}

.claude-feedback-launcher:hover {
  transform: scale(1.06);
}

.claude-feedback-launcher:active {
  transform: scale(0.94);
}

.claude-feedback-spin {
  animation: claude-feedback-spin 0.9s linear infinite;
}

.claude-feedback-input {
  transition: border-color 140ms ease-out, background 140ms ease-out;
}
.claude-feedback-input:focus {
  border-color: rgba(245, 158, 11, 0.55) !important;
}

.claude-feedback-button-primary {
  transition: background 140ms ease-out, transform 80ms ease-out;
}
.claude-feedback-button-primary:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.9);
}
.claude-feedback-button-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.claude-feedback-link-button {
  transition: background 140ms ease-out, color 140ms ease-out;
}
.claude-feedback-link-button:hover {
  background: rgba(245, 158, 11, 0.1);
}

.claude-feedback-ghost {
  transition: color 140ms ease-out;
}
.claude-feedback-ghost:hover {
  color: #f5f5f5;
}
`;
