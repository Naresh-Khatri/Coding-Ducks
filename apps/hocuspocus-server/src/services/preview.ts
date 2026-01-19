import fs from "fs";
import { db, ducklet, eq } from "@acme/db";
import { uploadFile } from "@acme/storage";
import chromium from "@sparticuz/chromium";
import nodeHtmlToImage from "node-html-to-image";
import puppeteer from "puppeteer-core";

export async function generateAndStorePreview({
  duckletId,
  html,
  css,
  js,
  headScripts,
}: {
  duckletId: number;
  html: string;
  css: string;
  js: string;
  headScripts: string;
}) {
  try {
    if (!html && !css && !js) {
      return;
    }

    const content = `
      <html>
        <head>
          ${headScripts}
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

    console.log(`Generating preview image for ducklet ${duckletId}...`);

    let executablePath: string | undefined;

    // specific check for local development to avoid hanging on chromium.executablePath()
    if (process.env.NODE_ENV !== "production") {
      if (fs.existsSync("/usr/bin/chromium")) {
        executablePath = "/usr/bin/chromium";
      } else if (fs.existsSync("/usr/bin/google-chrome")) {
        executablePath = "/usr/bin/google-chrome";
      }
    }

    if (!executablePath) {
      console.log("Fetching chromium executable path...");
      executablePath = await chromium.executablePath();
    }

    console.log(`Using chromium executable at: ${executablePath}`);

    // Use correct args based on environment
    const puppeteerLaunchArgs =
      process.env.NODE_ENV === "production"
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"];

    const image = (await nodeHtmlToImage({
      html: content,
      puppeteer,
      puppeteerArgs: {
        args: puppeteerLaunchArgs,
        defaultViewport: { width: 1200, height: 630 },
        executablePath,
        headless: (chromium as any).headless === "shell" ? "shell" : true,
        ignoreHTTPSErrors: true,
      } as any,
      type: "png",
    })) as Buffer;

    const key = `preview/${duckletId}/${Date.now()}.png`;

    await uploadFile(key, image, "image/png");

    await db
      .update(ducklet)
      .set({
        previewImage: key,
      })
      .where(eq(ducklet.id, duckletId));

    console.log(`Updated preview image for ducklet ${duckletId}`);
  } catch (err) {
    console.error("Failed to generate/store preview image:", err);
  }
}
