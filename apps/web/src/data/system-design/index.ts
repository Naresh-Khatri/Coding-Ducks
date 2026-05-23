import type { LevelDefinition } from "~/lib/system-design/types";
import { apiWithCache } from "./levels/api-with-cache";
import { asyncProcessing } from "./levels/async-processing";
import { cdnStaticSite } from "./levels/cdn-static-site";
import { eCommerceCheckout } from "./levels/e-commerce-checkout";
import { globalApi } from "./levels/global-api";
import { iotTelemetry } from "./levels/iot-telemetry";
import { realtimeChat } from "./levels/realtime-chat";
import { searchPlatform } from "./levels/search-platform";
import { simpleWebApp } from "./levels/simple-web-app";
import { socialMediaFeed } from "./levels/social-media-feed";

export const LEVELS: LevelDefinition[] = [
  // Beginner
  cdnStaticSite,
  simpleWebApp,
  apiWithCache,
  // Intermediate
  eCommerceCheckout,
  asyncProcessing,
  searchPlatform,
  realtimeChat,
  iotTelemetry,
  // Advanced
  socialMediaFeed,
  globalApi,
];

export function getLevelBySlug(slug: string): LevelDefinition | undefined {
  return LEVELS.find((l) => l.slug === slug);
}
