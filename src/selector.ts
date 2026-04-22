// Compute a reasonably stable CSS selector for an arbitrary DOM element.
// Preference order: #id → [data-testid] → short semantic path with
// :nth-of-type fallback to disambiguate siblings. Keeps selectors short
// enough that a human reading the GitHub issue can grok which element.

const MAX_DEPTH = 6;

export function generateSelector(el: Element): string {
  if (!(el instanceof Element)) return "";

  if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) {
    return `#${el.id}`;
  }

  const testId = el.getAttribute("data-testid");
  if (testId) return `[data-testid="${escapeAttr(testId)}"]`;

  const parts: string[] = [];
  let current: Element | null = el;
  let depth = 0;

  while (current && current !== document.body && depth < MAX_DEPTH) {
    let selector = current.tagName.toLowerCase();

    const representativeClass = pickClass(current);
    if (representativeClass) selector += `.${escapeCss(representativeClass)}`;

    const parent = current.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (c) => c.tagName === current?.tagName,
      );
      if (sameTag.length > 1) {
        const index = sameTag.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
    depth++;
  }

  return parts.join(" > ");
}

function pickClass(el: Element): string | null {
  const classes = Array.from(el.classList);
  if (classes.length === 0) return null;
  const named = classes.find((c) => !looksLikeTailwindAtom(c));
  if (named) return named;
  return classes[0] ?? null;
}

function looksLikeTailwindAtom(c: string): boolean {
  if (c.includes(":")) return true;
  if (/-[0-9]/.test(c)) return true;
  if (/\//.test(c)) return true;
  if (
    /^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|w|h|gap|grid|flex|bg|text|border|rounded|shadow|ring|opacity|space|size)(-|$)/.test(
      c,
    )
  ) {
    return true;
  }
  return false;
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, '\\"');
}

function escapeCss(v: string): string {
  return v.replace(/([^\w-])/g, "\\$1");
}
