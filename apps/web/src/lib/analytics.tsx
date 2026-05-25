import Script from "next/script";

import { env } from "~/env";

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function UmamiScript() {
  const src = env.NEXT_PUBLIC_UMAMI_SRC;
  const id = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!src || !id) return null;
  return (
    <Script src={src} data-website-id={id} strategy="afterInteractive" />
  );
}

export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.umami?.track(event, data);
}
