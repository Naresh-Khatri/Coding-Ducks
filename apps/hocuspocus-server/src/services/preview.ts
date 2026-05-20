import fs from "fs";
import { db, ducklet, eq } from "@acme/db";
import { uploadFile } from "@acme/storage";
import chromium from "@sparticuz/chromium";
import nodeHtmlToImage from "node-html-to-image";
import puppeteer from "puppeteer-core";

// Hostname allowlist for assets that may be loaded into the preview iframe.
// User-supplied <script> / <link> tags pointing anywhere else are stripped.
const ALLOWED_ASSET_HOSTS = new Set([
  "cdn.jsdelivr.net",
  "cdnjs.cloudflare.com",
  "unpkg.com",
  "cdn.tailwindcss.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
]);

function isAllowedAssetUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    return ALLOWED_ASSET_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Extracts only `<script src="...">` and `<link rel="stylesheet" href="...">`
 * tags whose URLs resolve to allowlisted hosts. Inline scripts, event handlers,
 * `javascript:` URLs, and anything else are dropped.
 */
function sanitizeHeadScripts(input: string): string {
  if (!input) return "";

  const parts: string[] = [];

  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  for (const match of input.matchAll(scriptRe)) {
    const attrs = match[1] ?? "";
    const body = (match[2] ?? "").trim();
    if (body.length > 0) continue; // drop inline scripts
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) continue;
    const src = srcMatch[1]!;
    if (!isAllowedAssetUrl(src)) continue;
    parts.push(`<script src="${encodeURI(src)}"></script>`);
  }

  const linkRe = /<link\b([^>]*)\/?>/gi;
  for (const match of input.matchAll(linkRe)) {
    const attrs = match[1] ?? "";
    const relMatch = attrs.match(/\brel\s*=\s*["']([^"']+)["']/i);
    const rel = (relMatch?.[1] ?? "").toLowerCase();
    if (rel !== "stylesheet" && rel !== "preconnect") continue;

    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1]!;
    if (!isAllowedAssetUrl(href)) continue;
    parts.push(`<link rel="${rel}" href="${encodeURI(href)}">`);
  }

  return parts.join("\n");
}

export async function generateAndStorePreview({
  duckletId,
  html,
  css,
  js: _js,
  headScripts,
}: {
  duckletId: number;
  html: string;
  css: string;
  js: string;
  headScripts: string;
}) {
  try {
    if (!html && !css) {
      return;
    }

    const safeHead = sanitizeHeadScripts(headScripts);

    const content = `
      <html>
        <head>
          ${safeHead}
          <style>
            body { margin: 0; padding: 0; overflow: hidden; background: #fff; }
            ${css}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    let executablePath: string | undefined;

    if (process.env.NODE_ENV !== "production") {
      if (fs.existsSync("/usr/bin/chromium")) {
        executablePath = "/usr/bin/chromium";
      } else if (fs.existsSync("/usr/bin/google-chrome")) {
        executablePath = "/usr/bin/google-chrome";
      }
    }

    if (!executablePath) {
      executablePath = await chromium.executablePath();
    }

    // JS from the editor is intentionally NOT executed during preview render —
    // we screenshot a static snapshot (HTML + sanitized head + CSS). This
    // sidesteps the need to run untrusted JS in the screenshotter.
    const baseArgs =
      process.env.NODE_ENV === "production"
        ? chromium.args
        : ["--disable-gpu"];
    const puppeteerLaunchArgs = [
      ...baseArgs,
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-web-security=false",
    ];

    const headlessMode: "shell" | true =
      (chromium as unknown as { headless?: string }).headless === "shell"
        ? "shell"
        : true;

    const image = (await nodeHtmlToImage({
      html: content,
      puppeteer,
      puppeteerArgs: {
        args: puppeteerLaunchArgs,
        defaultViewport: { width: 1200, height: 630 },
        executablePath,
        headless: headlessMode,
      },
      type: "png",
    })) as Buffer;

    const key = `preview/${duckletId}.png`;

    await uploadFile(key, image, "image/png");

    await db
      .update(ducklet)
      .set({
        previewImage: key,
        updatedAt: new Date(),
      })
      .where(eq(ducklet.id, duckletId));
  } catch (err) {
    console.error("Failed to generate/store preview image:", err);
  }
}
