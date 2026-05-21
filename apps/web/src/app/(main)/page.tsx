import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/auth/server";

import { HeroSection } from "./_components/hero-section";
import { FeaturesSection } from "./_components/features-section";
import { StatsBand } from "./_components/stats-band";
import { ClosingCta } from "./_components/closing-cta";
import { SiteFooter } from "./_components/site-footer";

export default async function Home() {
  // Logged-in users skip the marketing landing and go to their workspace.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect(session.user.isAdmin ? "/admin" : "/problems");
  }

  return (
    <main className="relative overflow-x-clip bg-black">
      <HeroSection />
      <FeaturesSection />
      <StatsBand />
      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
