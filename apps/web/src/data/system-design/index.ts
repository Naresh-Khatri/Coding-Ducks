import type { LevelDefinition } from "~/lib/system-design/types";
import { simpleWebApp } from "./levels/simple-web-app";
import { cdnStaticSite } from "./levels/cdn-static-site";
import { apiWithCache } from "./levels/api-with-cache";
import { eCommerceCheckout } from "./levels/e-commerce-checkout";
import { asyncProcessing } from "./levels/async-processing";
import { searchPlatform } from "./levels/search-platform";
import { realtimeChat } from "./levels/realtime-chat";
import { socialMediaFeed } from "./levels/social-media-feed";
import { globalApi } from "./levels/global-api";
import { iotTelemetry } from "./levels/iot-telemetry";

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
