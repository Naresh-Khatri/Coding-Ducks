/**
 * Brand logos for the "Asked at" companies, committed under
 * `public/brand-icons/` and fetched via the theSVG CLI:
 *
 *   npx @thesvg/cli add <slug> --format svg --dir apps/web/public/brand-icons
 *
 * Keyed by the exact company display name used in problem content. To add a new
 * company, run the CLI for its slug and add a row here. Monochrome logos (Apple,
 * Amazon) are rendered on a white chip so they stay visible in both themes.
 */
const COMPANY_ICON_SLUGS: Record<string, string> = {
  Meta: "meta",
  Amazon: "amazon",
  Apple: "apple",
  Google: "google",
  Airbnb: "airbnb",
  Microsoft: "microsoft",
  Atlassian: "atlassian",
  "Booking.com": "bookingdotcom",
  Linear: "linear",
  LinkedIn: "linkedin",
  Netflix: "netflix",
  Reddit: "reddit",
  Shopify: "shopify",
  Stripe: "stripe",
  Trello: "trello",
  // Uber's default logo is white (for dark UIs); the mono variant is black so it
  // stays visible on the white chip.
  Uber: "uber-mono",
};

/** Public path to a company's brand SVG, or null when we have no logo for it. */
export function companyIconSrc(company: string): string | null {
  const slug = COMPANY_ICON_SLUGS[company];
  return slug ? `/brand-icons/${slug}.svg` : null;
}
