// Lazy-loaded viewport screenshot helper. Dynamically imports html-to-image
// so its canvas rendering code only lands in the bundle once the widget
// is actually opened — users who never open it don't pay for it.

export interface CaptureOptions {
  /** DOM node to capture. Defaults to document.body. */
  target?: HTMLElement;
  /** PNG quality between 0 and 1. Defaults to 0.92. */
  quality?: number;
  /** Cap the longest edge of the output to limit upload size. Defaults to 1600px. */
  maxEdge?: number;
}

export interface CaptureResult {
  blob: Blob;
  width: number;
  height: number;
  dataUrl: string;
}

export async function captureScreenshot(
  options: CaptureOptions = {},
): Promise<CaptureResult> {
  if (typeof window === "undefined") {
    throw new Error("captureScreenshot can only run in the browser");
  }

  const target = options.target ?? document.body;
  const quality = options.quality ?? 0.92;
  const maxEdge = options.maxEdge ?? 1600;

  const { toBlob, toPng } = await import("html-to-image");

  const rect = target.getBoundingClientRect();
  const longestEdge = Math.max(rect.width, rect.height);
  const pixelRatio =
    longestEdge > maxEdge
      ? Math.max(maxEdge / longestEdge, 0.5)
      : Math.min(window.devicePixelRatio ?? 1, 2);

  const filter = (node: HTMLElement | Element) => {
    if (!(node instanceof HTMLElement)) return true;
    return node.dataset.claudeFeedbackRoot !== "true";
  };

  const blob = await toBlob(target, {
    quality,
    pixelRatio,
    cacheBust: true,
    filter,
  });

  if (!blob) {
    throw new Error("Screenshot capture returned an empty blob");
  }

  const dataUrl = await toPng(target, {
    quality,
    pixelRatio,
    cacheBust: true,
    filter,
  });

  return {
    blob,
    width: Math.round(rect.width * pixelRatio),
    height: Math.round(rect.height * pixelRatio),
    dataUrl,
  };
}

/**
 * Draw a red highlight rectangle over a captured screenshot. Burns the
 * annotation into the PNG so the uploaded image already has the context
 * baked in — no re-render pass when it lands in GitHub.
 */
export async function annotateScreenshot(
  sourceBlob: Blob,
  highlight: { x: number; y: number; width: number; height: number },
  devicePixelRatio = 1,
): Promise<Blob> {
  const bitmap = await createImageBitmap(sourceBlob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  ctx.drawImage(bitmap, 0, 0);

  const scale = canvas.width / (window.innerWidth * devicePixelRatio);
  const x = highlight.x * devicePixelRatio * scale;
  const y = highlight.y * devicePixelRatio * scale;
  const w = highlight.width * devicePixelRatio * scale;
  const h = highlight.height * devicePixelRatio * scale;

  ctx.strokeStyle = "rgba(220, 38, 38, 0.95)";
  ctx.lineWidth = Math.max(3, Math.round(canvas.width / 400));
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "rgba(5, 5, 5, 0.35)";
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.rect(x + w, y, -w, h);
  ctx.fill("evenodd");

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/png",
    );
  });
}
