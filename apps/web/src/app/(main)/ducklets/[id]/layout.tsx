import type { Metadata } from "next";

import { getQueryClient, trpc } from "~/trpc/server";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Server layout that only exists to attach per-ducklet OG / Twitter metadata —
 * the page itself is a client component and can't export `generateMetadata`.
 *
 * `byId` is a public procedure that throws for private ducklets a crawler can't
 * read, so a failed fetch (private, missing, or bad id) just falls back to a
 * generic title and never leaks a private room's name or screenshot.
 */
export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const id = Number((await params).id);
  const ducklet = Number.isInteger(id)
    ? await getQueryClient()
        .fetchQuery(trpc.room.byId.queryOptions({ id }))
        .catch(() => null)
    : null;

  if (!ducklet) {
    return { title: "Ducklet · Coding Ducks" };
  }

  const title = `${ducklet.name} · Coding Ducks`;
  const trimmed = ducklet.description?.trim();
  const description =
    trimmed && trimmed.length > 0
      ? trimmed
      : "A real-time collaborative coding room on Coding Ducks.";
  // Auto-captured 1200×630 preview (see `updatePreviewImage`); absolute CDN URL.
  const images = ducklet.previewImage
    ? [{ url: ducklet.previewImage, width: 1200, height: 630, alt: ducklet.name }]
    : undefined;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", images },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

export default function DuckletLayout({ children }: LayoutProps) {
  return children;
}
