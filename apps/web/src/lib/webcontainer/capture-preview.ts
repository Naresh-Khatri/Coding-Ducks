/**
 * Hidden, custom-resolution screenshots of the WebContainer preview.
 *
 * The preview is a *cross-origin* iframe, so the parent can't read its pixels
 * (same-origin policy). Instead we inject a tiny capture helper into every
 * preview page via `WebContainer.setPreviewScript` — that runs same-origin to
 * the user's app, so it *can* rasterize the DOM. To screenshot, the parent
 * loads the preview into an offscreen iframe sized to the target resolution
 * (so the app lays out at e.g. 1920×1080 regardless of the visible panel) and
 * asks the helper, over postMessage, to render and send back a PNG data URL.
 *
 * Nothing is shown to the user: the capture iframe is rendered off-screen and
 * removed as soon as the image comes back.
 */

const REQUEST = "editor:capture";
const RESULT = "editor:capture:result";

/** Pinned so capture output can't drift when esm.sh updates the latest tag. */
const SCREENSHOT_LIB = "https://esm.sh/modern-screenshot@4.6.0";

/**
 * Build the script injected into every preview page. It listens for capture
 * requests *from our app only* (origin-checked) and replies with a PNG. We bake
 * the parent origin in rather than trusting the message, so a third-party page
 * embedding the same preview URL can't trigger a capture.
 */
export function buildCaptureScript(parentOrigin: string): string {
  return `
const PARENT_ORIGIN = ${JSON.stringify(parentOrigin)};
const LIB = ${JSON.stringify(SCREENSHOT_LIB)};
window.addEventListener("message", async (event) => {
  if (event.origin !== PARENT_ORIGIN) return;
  const req = event.data;
  if (!req || req.type !== ${JSON.stringify(REQUEST)} || typeof req.id !== "string") return;
  const reply = (extra) =>
    event.source && event.source.postMessage(
      { type: ${JSON.stringify(RESULT)}, id: req.id, ...extra },
      event.origin,
    );
  try {
    const lib = await import(LIB);
    const toImage = req.format === "jpeg" ? lib.domToJpeg : req.format === "webp" ? lib.domToWebp : lib.domToPng;
    const dataUrl = await toImage(document.documentElement, {
      width: req.width,
      height: req.height,
      scale: req.pixelRatio || 1,
      quality: req.quality,
      backgroundColor: req.backgroundColor || "#ffffff",
    });
    reply({ ok: true, dataUrl });
  } catch (err) {
    reply({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});
`.trim();
}

export interface CapturePreviewOptions {
  /** Render width in CSS px (the iframe is sized to this). Default 1920. */
  width?: number;
  /** Render height in CSS px. Default 1080. */
  height?: number;
  /** Output image format. Default "png". */
  format?: "png" | "jpeg" | "webp";
  /** Quality 0–1 for lossy formats (jpeg/webp). Default 0.92. */
  quality?: number;
  /** Output device-pixel multiplier (2 = retina). Default 1. */
  pixelRatio?: number;
  /** Fallback background for transparent pages. Default white. */
  backgroundColor?: string;
  /** Delay after iframe load before capturing, to let the app paint. Default 1500ms. */
  settleMs?: number;
  /** Abort and reject after this long. Default 20000ms. */
  timeoutMs?: number;
}

/**
 * Screenshot a running preview at an exact resolution, off-screen. Resolves to
 * a PNG data URL. Requires the capture script to have been injected via
 * `setPreviewScript` (see `useWebContainerRuntime`).
 */
export function capturePreview(
  previewUrl: string,
  options: CapturePreviewOptions = {},
): Promise<string> {
  const {
    width = 1920,
    height = 1080,
    format = "png",
    quality = 0.92,
    pixelRatio = 1,
    backgroundColor = "#ffffff",
    settleMs = 1500,
    timeoutMs = 20000,
  } = options;

  const origin = new URL(previewUrl).origin;
  const id = `cap_${crypto.randomUUID()}`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  // Laid out at the target size (so the app is responsive to 1920×1080) but
  // pushed well off-screen and non-interactive — never visible to the user.
  Object.assign(iframe.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${width}px`,
    height: `${height}px`,
    border: "0",
    opacity: "0",
    pointerEvents: "none",
    transform: "translateX(-200vw)",
    zIndex: "-1",
  });
  iframe.src = previewUrl;

  return new Promise<string>((resolve, reject) => {
    let done = false;
    const finish = (run: () => void) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      run();
    };

    const timer = window.setTimeout(
      () => finish(() => reject(new Error("preview capture timed out"))),
      timeoutMs,
    );

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const data = event.data as
        | { type?: string; id?: string; ok?: boolean; dataUrl?: string; error?: string }
        | null;
      if (!data) return;
      if (data.type !== RESULT || data.id !== id) return;
      if (data.ok && typeof data.dataUrl === "string") {
        const url = data.dataUrl;
        finish(() => resolve(url));
      } else {
        finish(() => reject(new Error(data.error ?? "preview capture failed")));
      }
    };

    iframe.addEventListener("load", () => {
      // Let the app hydrate/paint, then ask the injected helper for a shot.
      window.setTimeout(() => {
        iframe.contentWindow?.postMessage(
          {
            type: REQUEST,
            id,
            width,
            height,
            format,
            quality,
            pixelRatio,
            backgroundColor,
          },
          origin,
        );
      }, settleMs);
    });

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
  });
}

/** Convert a PNG data URL (from `capturePreview`) to a Blob for upload. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
