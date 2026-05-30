import Script from "next/script";

import { env } from "~/env";

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

// Analytics is fully disabled outside production so local dev never loads the
// umami script or sends any events.
const analyticsEnabled = process.env.NODE_ENV === "production";

export function UmamiScript() {
  const src = env.NEXT_PUBLIC_UMAMI_SRC;
  const id = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!analyticsEnabled || !src || !id) return null;
  return (
    <Script src={src} data-website-id={id} strategy="afterInteractive" />
  );
}

export function track(event: string, data?: Record<string, unknown>) {
  if (!analyticsEnabled) return;
  if (typeof window === "undefined") return;
  window.umami?.track(event, data);
}
